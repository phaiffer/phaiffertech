# GCP Terraform Base

Base minima segura para o deploy inicial da plataforma na Google Cloud.

## Escopo

Esta base cria apenas os componentes necessarios para o primeiro deploy seguro:

- Artifact Registry para imagens
- Cloud SQL for PostgreSQL
- Secret Manager para segredos de runtime
- Cloud Run para backend e frontend
- service accounts e IAM minimo para runtime

Nao cria:

- VM unica
- PostgreSQL em container
- GKE
- VPC privada ou Serverless VPC Connector
- load balancer nesta etapa
- CI/CD complexo

## Estrategia de aplicacao

O fluxo recomendado e em duas fases:

1. `deploy_backend_service=false` e `deploy_frontend_service=false`
   Resultado: APIs, Artifact Registry, Cloud SQL, Secret Manager e service accounts.
2. Depois de publicar secrets e imagens, habilitar os servicos Cloud Run.

Isso evita depender de imagens inexistentes ou secrets sem versao.

## Sequencia objetiva

1. Copie `terraform.tfvars.example` para um arquivo local nao versionado.
2. Rode:

```bash
cd infra/gcp/terraform
terraform init
terraform apply
```

3. Capture os outputs:

```bash
terraform output artifact_registry_repository_url
terraform output cloud_sql_connection_name
terraform output cloud_sql_instance_name
terraform output -json secret_ids
```

4. Crie as versoes dos secrets no Secret Manager e configure o usuario do banco fora do Terraform.
5. Faça build/push das imagens para o Artifact Registry.
6. Ative `deploy_backend_service=true` e aplique novamente para subir a API.
7. Capture `backend_service_url`, gere a imagem do frontend com `NEXT_PUBLIC_API_URL=<backend_url>/api/v1` ou com o dominio final da API, depois ative `deploy_frontend_service=true`.
8. Reaplique para subir o frontend.

## Datasource JDBC para Cloud SQL

O backend agora inclui o Cloud SQL Java Connector no `pom.xml`.

Use um JDBC URL neste formato:

```text
jdbc:postgresql:///platform_prod_db?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=PROJECT:REGION:INSTANCE&ipTypes=PUBLIC&cloudSqlRefreshStrategy=lazy
```

Esse valor deve ir para o secret `SPRING_DATASOURCE_URL`.

## Dominio e TLS

Esta base nao cria dominio/TLS ainda porque a documentacao oficial do Cloud Run recomenda usar Global External Application Load Balancer para custom domains, e isso adiciona recursos que nao sao necessarios para colocar a stack online agora.

Quando o dominio final estiver definido, existem dois caminhos:

- recomendado: adicionar um unico Application Load Balancer com serverless NEG para `app.` e `api.`, depois restringir o backend para `internal-and-cloud-load-balancing`
- provisoriamente: mapear `app.` e `api.` direto para Cloud Run, aceitando a limitacao de domain mapping em preview

## Observacoes

- Os secret containers sao criados pelo Terraform, mas os valores reais devem ser publicados fora do codigo.
- O Terraform nao gerencia a senha do usuario PostgreSQL para evitar colocar segredo real em codigo ou estado por padrao.
- O backend fica publico apenas porque o frontend atual chama a API diretamente do navegador. CORS, docs publicas e observabilidade publica ficam controlados no runtime.
