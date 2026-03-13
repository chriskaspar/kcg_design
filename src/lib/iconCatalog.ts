import type { IconDefinition, VendorId } from "../types/architecture";

const createSourceIcon = (
  id: string,
  label: string,
  keywords: string[],
  assetPath: string,
  description: string
): IconDefinition => ({
  id,
  label,
  vendor: "generic",
  category: "Source Systems",
  service: label,
  keywords,
  assetPath,
  fallbackAssetPath: assetPath,
  description
});

const sourceSystemIcons: IconDefinition[] = [
  createSourceIcon("source-ehr", "EHR / EMR", ["ehr", "emr", "clinical"], "/icons/generic/database.svg", "Electronic health record source system."),
  createSourceIcon("source-hl7", "HL7 Feeds", ["hl7", "feeds", "adt"], "/icons/generic/api.svg", "Healthcare messaging and event feeds."),
  createSourceIcon("source-fhir", "FHIR APIs", ["fhir", "api", "healthcare api"], "/icons/generic/api.svg", "FHIR-based healthcare integration APIs."),
  createSourceIcon("source-claims", "Claims Systems", ["claims", "revenue cycle", "payer"], "/icons/generic/database.svg", "Claims and revenue-cycle transaction systems."),
  createSourceIcon("source-erp", "ERP / Finance", ["erp", "finance", "supply chain"], "/icons/generic/database.svg", "ERP and finance operational systems."),
  createSourceIcon("source-lab", "Lab / LIMS", ["lab", "lims", "laboratory"], "/icons/generic/database.svg", "Laboratory systems and LIMS sources."),
  createSourceIcon("source-imaging", "Imaging Metadata", ["imaging", "dicom", "radiology"], "/icons/generic/storage.svg", "Imaging metadata and associated assets."),
  createSourceIcon("source-documents", "Documents / Policies", ["documents", "policies", "notes", "content"], "/icons/generic/knowledge-base.svg", "Enterprise document and policy repositories."),
  createSourceIcon("source-edc", "EDC Systems", ["edc", "clinical trial"], "/icons/generic/web-app.svg", "Electronic data capture systems for trials."),
  createSourceIcon("source-ctms", "CTMS", ["ctms", "clinical trial management"], "/icons/generic/web-app.svg", "Clinical trial management system."),
  createSourceIcon("source-central-labs", "Central Labs", ["central labs", "clinical lab"], "/icons/generic/database.svg", "Central laboratory trial data sources."),
  createSourceIcon("source-safety", "Pharmacovigilance", ["safety", "pharmacovigilance"], "/icons/generic/web-app.svg", "Drug safety and adverse-event systems."),
  createSourceIcon("source-cro", "CRO Partner Data", ["cro", "partner data"], "/icons/generic/storage.svg", "Clinical research organization data feeds."),
  createSourceIcon("source-omics", "Genomics / Omics", ["genomics", "omics", "biomarker"], "/icons/generic/database.svg", "High-volume omics and biomarker datasets."),
  createSourceIcon("source-rwd", "Real World Data", ["real world data", "rwd"], "/icons/generic/database.svg", "External real-world and observational datasets."),
  createSourceIcon("source-eligibility", "Eligibility / Enrollment", ["eligibility", "enrollment"], "/icons/generic/database.svg", "Member eligibility and enrollment systems."),
  createSourceIcon("source-prior-auth", "Prior Authorization", ["prior authorization", "authorization"], "/icons/generic/web-app.svg", "Prior authorization workflow systems."),
  createSourceIcon("source-pbm", "Pharmacy / PBM", ["pbm", "pharmacy"], "/icons/generic/database.svg", "Pharmacy and PBM source systems."),
  createSourceIcon("source-crm", "CRM / Service", ["crm", "service", "customer"], "/icons/generic/web-app.svg", "CRM and service management applications."),
  createSourceIcon("source-sdoh", "Social Determinants Data", ["sdoh", "social determinants"], "/icons/generic/database.svg", "External social determinant datasets."),
  createSourceIcon("source-benchmarks", "External Benchmarks", ["benchmarks", "external"], "/icons/generic/analytics.svg", "Benchmark and market comparison feeds."),
  createSourceIcon("source-hospital", "Hospital System", ["hospital system", "hospital"], "/icons/generic/web-app.svg", "Hospital organization or system participant."),
  createSourceIcon("source-university", "Research University", ["research university", "university"], "/icons/generic/users.svg", "University or research partner."),
  createSourceIcon("source-public-health", "Public Health Agency", ["public health agency", "agency"], "/icons/generic/users.svg", "Public health organization participant."),
  createSourceIcon("source-payer-partner", "Payer Partner", ["payer partner", "payer"], "/icons/generic/users.svg", "Payer ecosystem partner."),
  createSourceIcon("source-files", "Files / Object Stores", ["files", "object store", "s3"], "/icons/generic/storage.svg", "File-based and object-store data sources."),
  createSourceIcon("source-operational-db", "Operational Databases", ["operational db", "database", "cdc"], "/icons/generic/database.svg", "Transactional operational databases."),
  createSourceIcon("source-api-systems", "APIs", ["apis", "api sources"], "/icons/generic/api.svg", "External or internal API-based sources."),
  createSourceIcon("source-event-streams", "Event Streams", ["kafka", "event streams", "stream"], "/icons/generic/api.svg", "Streaming event and message sources."),
  createSourceIcon("source-connected-devices", "Connected Devices / Telemetry", ["connected devices", "telemetry", "iot"], "/icons/generic/compute.svg", "Device telemetry and connected product events."),
  createSourceIcon("source-manufacturing", "Manufacturing / MES / Quality", ["manufacturing", "mes", "quality"], "/icons/generic/compute.svg", "Manufacturing execution and quality systems."),
  createSourceIcon("source-qms", "QMS / Complaints / CAPA", ["qms", "complaints", "capa"], "/icons/generic/web-app.svg", "Quality management, complaint, and CAPA systems."),
  createSourceIcon("source-regulatory-docs", "Regulatory Docs / SOPs / Manuals", ["regulatory docs", "sops", "manuals"], "/icons/generic/knowledge-base.svg", "Regulatory and operational document repositories."),
  createSourceIcon("source-clinical-performance", "Clinical / Product Performance", ["clinical performance", "product performance"], "/icons/generic/analytics.svg", "Clinical and product performance datasets."),
  createSourceIcon("source-adt", "HL7 ADT Messages", ["adt", "admission", "discharge", "transfer"], "/icons/generic/api.svg", "Admission, discharge, and transfer events."),
  createSourceIcon("source-scheduling", "Surgery Scheduling", ["surgery scheduling", "scheduling"], "/icons/generic/web-app.svg", "Surgery scheduling applications."),
  createSourceIcon("source-bed-management", "Bed Management", ["bed management", "bed"], "/icons/generic/dashboard.svg", "Bed management and capacity systems."),
  createSourceIcon("source-staffing", "Staff Scheduling", ["staff scheduling", "staff"], "/icons/generic-users.svg", "Workforce planning and staffing systems."),
  createSourceIcon("source-lab-instruments", "Lab Instruments", ["lab instruments", "instrument"], "/icons/generic/compute.svg", "Instrument-generated research data sources."),
  createSourceIcon("source-clinical-studies", "Clinical Studies", ["clinical studies"], "/icons/generic/database.svg", "Clinical study datasets."),
  createSourceIcon("source-scientific-literature", "Scientific Literature", ["scientific literature", "publications"], "/icons/generic/knowledge-base.svg", "Scientific literature and publication content."),
  createSourceIcon("source-mes", "Manufacturing Systems", ["manufacturing systems", "mes"], "/icons/generic/compute.svg", "Manufacturing systems and telemetry sources."),
  createSourceIcon("source-quality-systems", "Quality Systems", ["quality systems", "quality"], "/icons/generic/dashboard.svg", "Quality operations and compliance systems."),
  createSourceIcon("source-logistics", "Logistics", ["logistics"], "/icons/generic-api.svg", "Logistics and fulfillment systems."),
  createSourceIcon("source-suppliers", "Supplier Data", ["supplier data", "supplier"], "/icons/generic-storage.svg", "Supplier and partner operational feeds."),
  createSourceIcon("source-member-provider-crm", "Member / Provider CRM", ["member crm", "provider crm"], "/icons/generic/web-app.svg", "Member and provider relationship systems."),
  createSourceIcon("source-patient-support", "Patient Support", ["patient support"], "/icons/generic/users.svg", "Patient support program systems."),
  createSourceIcon("source-marketing", "Marketing Engagement", ["marketing", "engagement"], "/icons/generic/chat.svg", "Campaign and engagement platforms.")
];

export const iconCatalog: IconDefinition[] = [
  {
    id: "aws-api-gateway",
    label: "AWS API Gateway",
    vendor: "aws",
    category: "Integration",
    service: "API Gateway",
    keywords: ["api", "gateway", "rest", "http", "aws"],
    assetPath: "/icons/aws/api-gateway.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Managed API entry point for services and applications."
  },
  {
    id: "aws-lambda",
    label: "AWS Lambda",
    vendor: "aws",
    category: "Compute",
    service: "Lambda",
    keywords: ["serverless", "function", "lambda", "aws"],
    assetPath: "/icons/aws/lambda.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Event-driven serverless compute."
  },
  {
    id: "aws-s3",
    label: "Amazon S3",
    vendor: "aws",
    category: "Storage",
    service: "S3",
    keywords: ["bucket", "storage", "object", "aws"],
    assetPath: "/icons/aws/s3.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Object storage for files, media, and data lake zones."
  },
  {
    id: "azure-functions",
    label: "Azure Functions",
    vendor: "azure",
    category: "Compute",
    service: "Functions",
    keywords: ["azure", "functions", "serverless"],
    assetPath: "/icons/azure/functions.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Serverless event execution on Azure."
  },
  {
    id: "azure-sql",
    label: "Azure SQL",
    vendor: "azure",
    category: "Data",
    service: "SQL Database",
    keywords: ["azure", "sql", "database", "relational"],
    assetPath: "/icons/azure/sql.svg",
    fallbackAssetPath: "/icons/generic/database.svg",
    description: "Managed relational database."
  },
  {
    id: "gcp-cloud-run",
    label: "Cloud Run",
    vendor: "gcp",
    category: "Compute",
    service: "Cloud Run",
    keywords: ["gcp", "google", "run", "container", "serverless"],
    assetPath: "/icons/gcp/cloud-run.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Managed container execution."
  },
  {
    id: "gcp-bigquery",
    label: "BigQuery",
    vendor: "gcp",
    category: "Analytics",
    service: "BigQuery",
    keywords: ["warehouse", "analytics", "gcp", "google", "sql"],
    assetPath: "/icons/gcp/bigquery.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Cloud data warehouse and analytics service."
  },
  {
    id: "gcp-gcs",
    label: "Cloud Storage",
    vendor: "gcp",
    category: "Storage",
    service: "Cloud Storage",
    keywords: ["gcs", "cloud storage", "bucket", "google storage"],
    assetPath: "/icons/gcp/cloud-storage.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Object storage for landing and raw zones."
  },
  {
    id: "gcp-pubsub",
    label: "Pub/Sub",
    vendor: "gcp",
    category: "Integration",
    service: "Pub/Sub",
    keywords: ["pubsub", "queue", "streaming", "eventing"],
    assetPath: "/icons/gcp/pubsub.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Event ingestion and message transport."
  },
  {
    id: "gcp-gke",
    label: "Google Kubernetes Engine",
    vendor: "gcp",
    category: "Compute",
    service: "GKE",
    keywords: ["gke", "kubernetes", "containers", "cluster"],
    assetPath: "/icons/gcp/gke.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Managed Kubernetes platform."
  },
  {
    id: "gcp-vertex-ai",
    label: "Vertex AI",
    vendor: "gcp",
    category: "AI/ML",
    service: "Vertex AI",
    keywords: ["vertex", "ai", "model", "ml", "gcp ai"],
    assetPath: "/icons/gcp/vertex-ai.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Managed ML and GenAI development services."
  },
  {
    id: "gcp-dataflow",
    label: "Dataflow",
    vendor: "gcp",
    category: "Data",
    service: "Dataflow",
    keywords: ["dataflow", "pipeline", "stream processing"],
    assetPath: "/icons/gcp/dataflow.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Managed data processing pipelines."
  },
  {
    id: "databricks-home",
    label: "Databricks Home",
    vendor: "databricks",
    category: "Workspace",
    service: "Home",
    keywords: ["databricks", "home", "landing", "workspace home"],
    assetPath: "/icons/databricks/home.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Workspace landing page for Databricks users."
  },
  {
    id: "databricks-workspace",
    label: "Databricks Workspace",
    vendor: "databricks",
    category: "Workspace",
    service: "Workspace",
    keywords: ["databricks", "workspace", "folders", "notebooks"],
    assetPath: "/icons/databricks/workspace.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Collaborative workspace for notebooks, repos, and assets."
  },
  {
    id: "databricks-recents",
    label: "Databricks Recents",
    vendor: "databricks",
    category: "Workspace",
    service: "Recents",
    keywords: ["databricks", "recents", "recent files", "history"],
    assetPath: "/icons/databricks/recents.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Recent notebooks, dashboards, queries, and assets."
  },
  {
    id: "databricks-favorites",
    label: "Databricks Favorites",
    vendor: "databricks",
    category: "Workspace",
    service: "Favorites",
    keywords: ["databricks", "favorites", "starred"],
    assetPath: "/icons/databricks/favorites.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Pinned and favorited Databricks assets."
  },
  {
    id: "databricks-lakehouse",
    label: "Databricks Lakehouse",
    vendor: "databricks",
    category: "Analytics",
    service: "Lakehouse",
    keywords: ["databricks", "lakehouse", "delta", "analytics"],
    assetPath: "/icons/databricks/lakehouse.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Unified analytics and AI lakehouse platform."
  },
  {
    id: "databricks-sql",
    label: "Databricks SQL",
    vendor: "databricks",
    category: "Analytics",
    service: "SQL",
    keywords: ["databricks sql", "warehouse", "bi", "sql endpoint"],
    assetPath: "/icons/databricks/sql.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "SQL analytics and BI serving tier."
  },
  {
    id: "databricks-sql-editor",
    label: "Databricks SQL Editor",
    vendor: "databricks",
    category: "SQL",
    service: "SQL Editor",
    keywords: ["databricks", "sql editor", "editor", "query editor"],
    assetPath: "/icons/databricks/sql-editor.svg",
    fallbackAssetPath: "/icons/databricks/sql.svg",
    description: "Interactive SQL authoring workspace."
  },
  {
    id: "databricks-queries",
    label: "Databricks Queries",
    vendor: "databricks",
    category: "SQL",
    service: "Queries",
    keywords: ["databricks", "queries", "sql queries"],
    assetPath: "/icons/databricks/queries.svg",
    fallbackAssetPath: "/icons/databricks/sql.svg",
    description: "Saved SQL queries and query assets."
  },
  {
    id: "databricks-dashboards",
    label: "Databricks Dashboards",
    vendor: "databricks",
    category: "SQL",
    service: "Dashboards",
    keywords: ["databricks", "dashboard", "dashboards", "bi"],
    assetPath: "/icons/databricks/dashboards.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Interactive dashboarding for Databricks SQL."
  },
  {
    id: "databricks-genie",
    label: "Databricks Genie",
    vendor: "databricks",
    category: "SQL",
    service: "Genie",
    keywords: ["databricks", "genie", "genie space", "assistant"],
    assetPath: "/icons/databricks/genie.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Natural-language analytics interface for data consumers."
  },
  {
    id: "databricks-alerts",
    label: "Databricks Alerts",
    vendor: "databricks",
    category: "SQL",
    service: "Alerts",
    keywords: ["databricks", "alerts", "alert", "notification"],
    assetPath: "/icons/databricks/alerts.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Operational alerting and threshold monitoring."
  },
  {
    id: "databricks-legacy-alert",
    label: "Databricks Legacy Alert",
    vendor: "databricks",
    category: "SQL",
    service: "Legacy Alert",
    keywords: ["databricks", "legacy alert", "old alert"],
    assetPath: "/icons/databricks/alerts.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Legacy Databricks SQL alert object."
  },
  {
    id: "databricks-query-history",
    label: "Databricks Query History",
    vendor: "databricks",
    category: "SQL",
    service: "Query History",
    keywords: ["databricks", "query history", "history"],
    assetPath: "/icons/databricks/query-history.svg",
    fallbackAssetPath: "/icons/databricks/queries.svg",
    description: "History of SQL query executions."
  },
  {
    id: "databricks-sql-warehouses",
    label: "Databricks SQL Warehouses",
    vendor: "databricks",
    category: "SQL",
    service: "SQL Warehouses",
    keywords: ["databricks", "sql warehouse", "warehouse", "compute endpoint"],
    assetPath: "/icons/databricks/sql-warehouses.svg",
    fallbackAssetPath: "/icons/databricks/sql.svg",
    description: "Managed SQL compute for BI and analytics workloads."
  },
  {
    id: "databricks-workflows",
    label: "Databricks Workflows",
    vendor: "databricks",
    category: "Orchestration",
    service: "Workflows",
    keywords: ["workflow", "jobs", "orchestration", "databricks jobs"],
    assetPath: "/icons/databricks/workflows.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Orchestration for pipelines and jobs."
  },
  {
    id: "databricks-jobs-pipelines",
    label: "Databricks Jobs & Pipelines",
    vendor: "databricks",
    category: "Workspace",
    service: "Jobs & Pipelines",
    keywords: ["databricks", "jobs", "pipelines", "workflow"],
    assetPath: "/icons/databricks/jobs-pipelines.svg",
    fallbackAssetPath: "/icons/databricks/workflows.svg",
    description: "Central navigation for jobs, pipelines, and orchestration."
  },
  {
    id: "databricks-jobs",
    label: "Databricks Jobs",
    vendor: "databricks",
    category: "Data Engineering",
    service: "Job",
    keywords: ["databricks", "job", "scheduled job"],
    assetPath: "/icons/databricks/job.svg",
    fallbackAssetPath: "/icons/databricks/workflows.svg",
    description: "Scheduled and orchestrated data or ML jobs."
  },
  {
    id: "databricks-runs",
    label: "Databricks Runs",
    vendor: "databricks",
    category: "Data Engineering",
    service: "Runs",
    keywords: ["databricks", "runs", "executions", "job runs"],
    assetPath: "/icons/databricks/runs.svg",
    fallbackAssetPath: "/icons/databricks/workflows.svg",
    description: "Execution history for jobs and pipelines."
  },
  {
    id: "databricks-data-ingestion",
    label: "Databricks Data Ingestion",
    vendor: "databricks",
    category: "Data Engineering",
    service: "Data Ingestion",
    keywords: ["databricks", "data ingestion", "ingestion", "connectors"],
    assetPath: "/icons/databricks/data-ingestion.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Managed data ingestion workflows and connectors."
  },
  {
    id: "databricks-etl-pipeline",
    label: "Databricks ETL Pipeline",
    vendor: "databricks",
    category: "Data Engineering",
    service: "ETL Pipeline",
    keywords: ["databricks", "etl pipeline", "pipeline", "etl"],
    assetPath: "/icons/databricks/etl-pipeline.svg",
    fallbackAssetPath: "/icons/databricks/dlt.svg",
    description: "Pipeline asset for batch or streaming ETL."
  },
  {
    id: "databricks-compute",
    label: "Databricks Compute",
    vendor: "databricks",
    category: "Workspace",
    service: "Compute",
    keywords: ["databricks", "compute", "clusters", "serverless"],
    assetPath: "/icons/databricks/compute.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Compute resources including clusters and serverless."
  },
  {
    id: "databricks-discover",
    label: "Databricks Discover",
    vendor: "databricks",
    category: "Workspace",
    service: "Discover",
    keywords: ["databricks", "discover", "beta", "search"],
    assetPath: "/icons/databricks/discover.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Discovery experience for assets and knowledge across the workspace."
  },
  {
    id: "databricks-marketplace",
    label: "Databricks Marketplace",
    vendor: "databricks",
    category: "Workspace",
    service: "Marketplace",
    keywords: ["databricks", "marketplace", "data products"],
    assetPath: "/icons/databricks/marketplace.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Marketplace for data products, models, and partner assets."
  },
  {
    id: "databricks-governance",
    label: "Unity Catalog",
    vendor: "databricks",
    category: "Governance",
    service: "Unity Catalog",
    keywords: ["unity catalog", "governance", "catalog", "lineage"],
    assetPath: "/icons/databricks/unity-catalog.svg",
    fallbackAssetPath: "/icons/generic/database.svg",
    description: "Centralized governance, permissions, and lineage."
  },
  {
    id: "databricks-dlt",
    label: "Delta Live Tables",
    vendor: "databricks",
    category: "Data",
    service: "Delta Live Tables",
    keywords: ["dlt", "delta live tables", "pipeline", "quality"],
    assetPath: "/icons/databricks/dlt.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Managed ETL and data quality pipelines."
  },
  {
    id: "databricks-notebook",
    label: "Databricks Notebook",
    vendor: "databricks",
    category: "Workspace",
    service: "Notebook",
    keywords: ["databricks", "notebook", "workspace notebook"],
    assetPath: "/icons/databricks/notebook.svg",
    fallbackAssetPath: "/icons/databricks/workspace.svg",
    description: "Notebook asset for interactive code and documentation."
  },
  {
    id: "databricks-query",
    label: "Databricks Query",
    vendor: "databricks",
    category: "SQL",
    service: "Query",
    keywords: ["databricks", "query", "sql query"],
    assetPath: "/icons/databricks/queries.svg",
    fallbackAssetPath: "/icons/databricks/sql.svg",
    description: "Saved query object for SQL analysis."
  },
  {
    id: "databricks-dashboard",
    label: "Databricks Dashboard",
    vendor: "databricks",
    category: "SQL",
    service: "Dashboard",
    keywords: ["databricks", "dashboard"],
    assetPath: "/icons/databricks/dashboards.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Dashboard object for analytics sharing."
  },
  {
    id: "databricks-genie-space",
    label: "Databricks Genie Space",
    vendor: "databricks",
    category: "SQL",
    service: "Genie Space",
    keywords: ["databricks", "genie space", "genie"],
    assetPath: "/icons/databricks/genie.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Genie space asset for conversational analytics experiences."
  },
  {
    id: "databricks-ml",
    label: "Databricks ML",
    vendor: "databricks",
    category: "AI/ML",
    service: "Machine Learning",
    keywords: ["databricks", "ml", "model", "training"],
    assetPath: "/icons/databricks/ml.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Machine learning workflows and model lifecycle."
  },
  {
    id: "databricks-playground",
    label: "Databricks Playground",
    vendor: "databricks",
    category: "AI/ML",
    service: "Playground",
    keywords: ["databricks", "playground", "llm playground"],
    assetPath: "/icons/databricks/playground.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Interactive playground for generative AI experimentation."
  },
  {
    id: "databricks-ai-gateway",
    label: "Databricks AI Gateway",
    vendor: "databricks",
    category: "AI/ML",
    service: "AI Gateway",
    keywords: ["databricks", "ai gateway", "gateway", "llm routing"],
    assetPath: "/icons/databricks/ai-gateway.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Gateway and control plane for AI model access and routing."
  },
  {
    id: "databricks-experiments",
    label: "Databricks Experiments",
    vendor: "databricks",
    category: "AI/ML",
    service: "Experiments",
    keywords: ["databricks", "experiments", "experiment tracking"],
    assetPath: "/icons/databricks/experiments.svg",
    fallbackAssetPath: "/icons/databricks/ml.svg",
    description: "Experiment tracking for ML and AI workflows."
  },
  {
    id: "databricks-experiment",
    label: "Databricks Experiment",
    vendor: "databricks",
    category: "AI/ML",
    service: "Experiment",
    keywords: ["databricks", "experiment"],
    assetPath: "/icons/databricks/experiments.svg",
    fallbackAssetPath: "/icons/databricks/ml.svg",
    description: "Experiment asset within Databricks ML workflows."
  },
  {
    id: "databricks-features",
    label: "Databricks Features",
    vendor: "databricks",
    category: "AI/ML",
    service: "Features",
    keywords: ["databricks", "features", "feature store"],
    assetPath: "/icons/databricks/features.svg",
    fallbackAssetPath: "/icons/databricks/ml.svg",
    description: "Feature discovery and management for ML systems."
  },
  {
    id: "databricks-models",
    label: "Databricks Models",
    vendor: "databricks",
    category: "AI/ML",
    service: "Models",
    keywords: ["databricks", "models", "model registry"],
    assetPath: "/icons/databricks/models.svg",
    fallbackAssetPath: "/icons/databricks/ml.svg",
    description: "Model registry and lifecycle management."
  },
  {
    id: "databricks-model",
    label: "Databricks Model",
    vendor: "databricks",
    category: "AI/ML",
    service: "Model",
    keywords: ["databricks", "model"],
    assetPath: "/icons/databricks/models.svg",
    fallbackAssetPath: "/icons/databricks/ml.svg",
    description: "Model asset for training, evaluation, and deployment."
  },
  {
    id: "databricks-serving",
    label: "Databricks Serving",
    vendor: "databricks",
    category: "AI/ML",
    service: "Serving",
    keywords: ["databricks", "serving", "model serving", "online inference"],
    assetPath: "/icons/databricks/serving.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Online serving layer for deployed models and AI endpoints."
  },
  {
    id: "databricks-service-endpoint",
    label: "Databricks Service Endpoint",
    vendor: "databricks",
    category: "AI/ML",
    service: "Service Endpoint",
    keywords: ["databricks", "service endpoint", "endpoint", "serving endpoint"],
    assetPath: "/icons/databricks/service-endpoint.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Service endpoint for AI or model access."
  },
  {
    id: "databricks-app",
    label: "Databricks App",
    vendor: "databricks",
    category: "AI/ML",
    service: "App",
    keywords: ["databricks", "app", "application"],
    assetPath: "/icons/databricks/app.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Application layer built on top of Databricks services."
  },
  {
    id: "databricks-git-folder",
    label: "Databricks Git Folder",
    vendor: "databricks",
    category: "Workspace",
    service: "Git Folder",
    keywords: ["databricks", "git", "repo", "folder"],
    assetPath: "/icons/databricks/git-folder.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Git-backed workspace folder or repo asset."
  },
  ...sourceSystemIcons,
  {
    id: "generic-user",
    label: "User / Client",
    vendor: "generic",
    category: "Actors",
    service: "Client",
    keywords: ["user", "browser", "mobile", "consumer", "client"],
    assetPath: "/icons/generic/user.svg",
    fallbackAssetPath: "/icons/generic/user.svg",
    description: "End-user or external client."
  },
  {
    id: "generic-web-app",
    label: "Web App",
    vendor: "generic",
    category: "Applications",
    service: "Frontend",
    keywords: ["web", "frontend", "ui", "portal", "application"],
    assetPath: "/icons/generic/web-app.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Frontend or customer-facing application."
  },
  {
    id: "generic-dashboard",
    label: "Dashboard",
    vendor: "generic",
    category: "Applications",
    service: "Dashboard",
    keywords: ["dashboard", "analytics dashboard", "bi dashboard"],
    assetPath: "/icons/generic/dashboard.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Dashboard or reporting experience."
  },
  {
    id: "generic-chat",
    label: "Chat Experience",
    vendor: "generic",
    category: "Applications",
    service: "Chat",
    keywords: ["chat", "assistant", "conversation"],
    assetPath: "/icons/generic/chat.svg",
    fallbackAssetPath: "/icons/generic/web-app.svg",
    description: "Chat UI or conversational application."
  },
  {
    id: "generic-database",
    label: "Database",
    vendor: "generic",
    category: "Data",
    service: "Database",
    keywords: ["database", "sql", "nosql", "data"],
    assetPath: "/icons/generic/database.svg",
    fallbackAssetPath: "/icons/generic/database.svg",
    description: "Database fallback for unsupported vendors."
  },
  {
    id: "generic-ai",
    label: "AI Service",
    vendor: "generic",
    category: "AI/ML",
    service: "AI",
    keywords: ["ai", "model", "llm", "inference"],
    assetPath: "/icons/generic/ai.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Generic AI service or model endpoint."
  },
  {
    id: "generic-agent",
    label: "Agent",
    vendor: "generic",
    category: "AI/ML",
    service: "Agent",
    keywords: ["agent", "ai agent", "workflow agent"],
    assetPath: "/icons/generic/agent.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "Autonomous or orchestrated AI agent."
  },
  {
    id: "generic-model",
    label: "Model",
    vendor: "generic",
    category: "AI/ML",
    service: "Model",
    keywords: ["model", "ml model", "llm"],
    assetPath: "/icons/generic/model.svg",
    fallbackAssetPath: "/icons/generic/ai.svg",
    description: "AI or ML model."
  },
  {
    id: "generic-knowledgebase",
    label: "Knowledge Base",
    vendor: "generic",
    category: "AI/ML",
    service: "Knowledge Base",
    keywords: ["knowledge base", "kb", "rag", "documents"],
    assetPath: "/icons/generic/knowledge-base.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Knowledge store for retrieval and grounding."
  },
  {
    id: "generic-storage",
    label: "Storage",
    vendor: "generic",
    category: "Storage",
    service: "Storage",
    keywords: ["storage", "file", "blob", "object"],
    assetPath: "/icons/generic/storage.svg",
    fallbackAssetPath: "/icons/generic/storage.svg",
    description: "Generic object or file storage."
  },
  {
    id: "generic-api",
    label: "API Service",
    vendor: "generic",
    category: "Integration",
    service: "API",
    keywords: ["api", "service", "integration"],
    assetPath: "/icons/generic/api.svg",
    fallbackAssetPath: "/icons/generic/api.svg",
    description: "Generic service endpoint or integration layer."
  },
  {
    id: "generic-analytics",
    label: "Analytics Engine",
    vendor: "generic",
    category: "Analytics",
    service: "Analytics",
    keywords: ["analytics", "warehouse", "bi"],
    assetPath: "/icons/generic/analytics.svg",
    fallbackAssetPath: "/icons/generic/analytics.svg",
    description: "Generic analytics or processing engine."
  },
  {
    id: "generic-compute",
    label: "Compute Service",
    vendor: "generic",
    category: "Compute",
    service: "Compute",
    keywords: ["compute", "vm", "container", "service"],
    assetPath: "/icons/generic/compute.svg",
    fallbackAssetPath: "/icons/generic/compute.svg",
    description: "Generic compute or orchestration tier."
  },
  {
    id: "generic-users",
    label: "Users",
    vendor: "generic",
    category: "Actors",
    service: "Users",
    keywords: ["users", "group", "team", "audience"],
    assetPath: "/icons/generic/users.svg",
    fallbackAssetPath: "/icons/generic/user.svg",
    description: "Group of end users or personas."
  }
];

export const vendorLabels: Record<VendorId, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
  databricks: "Databricks",
  generic: "Generic"
};

export const getIconById = (iconId: string): IconDefinition =>
  iconCatalog.find((icon) => icon.id === iconId) ??
  iconCatalog.find((icon) => icon.id === "generic-api")!;

export const getGroupedIcons = () => {
  return iconCatalog.reduce<Record<string, Record<string, IconDefinition[]>>>((acc, icon) => {
    const vendorBucket = acc[icon.vendor] ?? {};
    const categoryBucket = vendorBucket[icon.category] ?? [];
    categoryBucket.push(icon);
    vendorBucket[icon.category] = categoryBucket;
    acc[icon.vendor] = vendorBucket;
    return acc;
  }, {});
};
