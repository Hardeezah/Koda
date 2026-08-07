# Regulatory source documents for RAG ingestion

Place PDF or TXT files here, named by source key, then run:

```bash
cd backend
python -m scripts.ingest_regulations
```

## Expected files

| Filename | Agency |
|----------|--------|
| `afcfta_rules_of_origin.pdf` | AfCFTA Secretariat |
| `afcfta_nigeria_tariff_offer.pdf` | AfCFTA Secretariat |
| `ncs_2026_prohibition_list.pdf` | Nigeria Customs Service |
| `cbn_trade_finance_circular.pdf` | Central Bank of Nigeria |
| `nafdac_import_guidelines.pdf` | NAFDAC |
| `son_mancap_schedule.pdf` | Standards Organisation of Nigeria |
| `nepc_export_guidelines.txt` | Nigerian Export Promotion Council |
| `firs_vat_on_trade.txt` | Federal Inland Revenue Service |
| `ncs_import_documentation.txt` | Nigeria Customs Service |
| `soncap_comprehensive_guidelines.txt` | Standards Organisation of Nigeria |
| `nafdac_regulated_products_list.txt` | NAFDAC |
| `nipc_investment_incentives.txt` | Nigerian Investment Promotion Commission |

Re-running ingestion is idempotent (replaces chunks per source).
