import os
import sys
import asyncio
import pandas as pd
import mlflow
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    context_precision,
    context_recall,
)
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from app.infrastructure.rag.retriever import regulatory_retriever
from app.infrastructure.rag.reranker import rerank
from app.infrastructure.rag.compliance_chain import compliance_chain


async def build_test_dataset() -> Dataset:
    test_questions = [
        {"question": "What are the export requirements for Cocoa Beans to Ghana?", "product": "Cocoa Beans", "direction": "export"},
        {"question": "Can I import tramadol into Nigeria without NAFDAC?", "product": "Tramadol", "direction": "import"},
        {"question": "What is the import duty for solar panels?", "product": "Solar Panels", "direction": "import"},
    ]
    
    data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": [] # Typically you'd have human-annotated ground truth here
    }

    # Mock ground truths for demonstration
    mock_truths = [
        "You need an NXP form, NEPC certificate, and AfCFTA Certificate of Origin. Phytosanitary certificate may also be required.",
        "No, Tramadol is strictly regulated and requires NAFDAC import registration and a permit to import.",
        "Solar panels typically attract 0% import duty in Nigeria to encourage renewable energy, but a 7.5% VAT may apply."
    ]
    
    for i, tq in enumerate(test_questions):
        print(f"Evaluating: {tq['question']}")
        
        # 1. Retrieve & Rerank (Simulate the orchestration)
        chunks = await regulatory_retriever.retrieve_for_compliance(tq["product"], tq["direction"])
        query_terms = tq["product"].lower().split() + [tq["direction"], "nigeria", "compliance"]
        ranked_chunks = rerank(chunks, query_terms)
        contexts = [c.content for c in ranked_chunks]
        
        # 2. Generate
        verdict = await compliance_chain.run(tq["product"], direction=tq["direction"])
        
        data["question"].append(tq["question"])
        data["answer"].append(verdict.summary + " " + verdict.what_to_do)
        data["contexts"].append(contexts)
        data["ground_truth"].append(mock_truths[i])
        
    return Dataset.from_dict(data)

async def run_evaluation():
    # Ragas uses LangChain LLMs under the hood, we can point it to Groq or OpenAI
    # For Ragas evaluation, OpenAI GPT-4 is typically recommended as the judge
    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY is required for Ragas evaluation.")
        return

    print("Building evaluation dataset...")
    dataset = await build_test_dataset()
    
    judge_llm = ChatOpenAI(model="gpt-4-turbo-preview")
    judge_embeddings = OpenAIEmbeddings()
    
    print("Running Ragas evaluation...")
    
    mlflow.set_experiment("KodaTrade_RAG_Evaluation")
    with mlflow.start_run():
        # Log Hyperparameters
        mlflow.log_param("judge_llm", "gpt-4-turbo-preview")
        mlflow.log_param("eval_dataset_size", len(test_questions) if 'test_questions' in locals() else 3)
        mlflow.log_param("embedding_model", "OpenAIEmbeddings")
        
        result = evaluate(
            dataset,
            metrics=[
                faithfulness,
                context_precision,
                context_recall
            ],
            llm=judge_llm,
            embeddings=judge_embeddings
        )
        
        print("\n--- RAG Evaluation Results ---")
        print(result)
        
        # Log Metrics
        faithfulness_score = result.get("faithfulness", 0.0)
        precision_score = result.get("context_precision", 0.0)
        recall_score = result.get("context_recall", 0.0)
        
        mlflow.log_metric("faithfulness", faithfulness_score)
        mlflow.log_metric("context_precision", precision_score)
        mlflow.log_metric("context_recall", recall_score)
        
        df = result.to_pandas()
        csv_path = "rag_evaluation_results.csv"
        df.to_csv(csv_path, index=False)
        print(f"Saved detailed results to {csv_path}")
        
        # Log Artifact
        mlflow.log_artifact(csv_path)
        
        # --- ML CI/CD QUALITY GATE ---
        QUALITY_THRESHOLD = 0.85
        if faithfulness_score < QUALITY_THRESHOLD:
            print(f"\n[❌] QUALITY GATE FAILED: Faithfulness ({faithfulness_score:.2f}) is below threshold ({QUALITY_THRESHOLD})")
            sys.exit(1)
        else:
            print(f"\n[✅] QUALITY GATE PASSED: Faithfulness ({faithfulness_score:.2f}) meets threshold ({QUALITY_THRESHOLD})")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
