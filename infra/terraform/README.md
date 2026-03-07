# Infra Terraform (OCI Base)

Base inicial de IaC para Oracle Cloud Infrastructure.

Arquivos disponíveis:

- `provider.tf`
- `variables.tf`
- `network.tf`
- `compute.tf`
- `mysql.tf`
- `outputs.tf`

Objetivo desta fase:

- Estruturar VCN, subnets e segurança de rede.
- Definir compute e load balancer para aplicação.
- Definir blueprint para MySQL managed service.
- Preparar evolução para ambientes `dev/stg/prod`.

Execução local:

```bash
make terraform-init
make terraform-plan
```

Observação:

- Esta base é preparatória e não foi aplicada automaticamente em cloud nesta etapa.
