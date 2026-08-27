-- Add full-text search column to document_chunks
alter table document_chunks
add column if not exists content_fts tsvector generated always as (to_tsvector('english', content)) stored;

-- Create GiST index for fast full text search
create index if not exists document_chunks_content_fts_idx
on document_chunks
using gist (content_fts);

-- Create Hybrid Search RPC (RRF combining dense vector similarity and BM25 text ranking)
create or replace function match_document_chunks_hybrid(
    query_text text,
    query_embedding vector(1536),
    match_count int default 8,
    filter_agency text default null
)
returns table (
    id uuid,
    source text,
    agency text,
    doc_date text,
    url text,
    chunk_index integer,
    content text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    with vector_matches as (
        select
            dc.id,
            1 - (dc.embedding <=> query_embedding) as vector_score,
            row_number() over (order by dc.embedding <=> query_embedding) as vector_rank
        from document_chunks dc
        where (filter_agency is null or dc.agency = filter_agency)
        order by vector_rank
        limit match_count * 2
    ),
    fts_matches as (
        select
            dc.id,
            ts_rank(dc.content_fts, plainto_tsquery('english', query_text)) as fts_score,
            row_number() over (order by ts_rank(dc.content_fts, plainto_tsquery('english', query_text)) desc) as fts_rank
        from document_chunks dc
        where 
            (filter_agency is null or dc.agency = filter_agency)
            and dc.content_fts @@ plainto_tsquery('english', query_text)
        order by fts_rank
        limit match_count * 2
    )
    select
        dc.id,
        dc.source,
        dc.agency,
        dc.doc_date,
        dc.url,
        dc.chunk_index,
        dc.content,
        -- RRF Score (k=60 is standard)
        (
            coalesce(1.0 / (60 + vm.vector_rank), 0.0) +
            coalesce(1.0 / (60 + fm.fts_rank), 0.0)
        )::float as similarity
    from document_chunks dc
    left join vector_matches vm on dc.id = vm.id
    left join fts_matches fm on dc.id = fm.id
    where vm.id is not null or fm.id is not null
    order by similarity desc
    limit match_count;
end;
$$;
