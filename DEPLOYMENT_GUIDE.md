# Deployment Guide (All 3 Projects)

All repositories now include `Dockerfile` and `render.yaml`.

## 1) Order Processing Platform

Repo: https://github.com/alexjoyy/order-processing-platform

Steps:
1. Open Render Blueprint deploy.
2. Point to the repository.
3. Render reads `render.yaml` and provisions:
   - `order-service`
   - `inventory-service`
   - `payment-service`
   - 3 PostgreSQL databases
4. In Render dashboard, set the same `JWT_SECRET` value for all three services.
5. Set `INVENTORY_BASE_URL` and `PAYMENT_BASE_URL` on `order-service` to the actual deployed service URLs.

## 2) Payments Reconciliation Service

Repo: https://github.com/alexjoyy/payments-reconciliation-service

Steps:
1. Deploy with Render Blueprint from repo root.
2. Render provisions the web service and Postgres DB from `render.yaml`.
3. Verify health endpoint: `/actuator/health`.

## 3) AI Support Assistant API

Repo: https://github.com/alexjoyy/ai-support-assistant-api

Steps:
1. Deploy with Render Blueprint from repo root.
2. Verify health endpoint: `/actuator/health`.
3. Test draft endpoint with sample payload from README.

## Post-deploy Checklist

1. Add deployed API URLs in each repo README.
2. Add those live links to your portfolio project cards.
3. Keep GitHub repos pinned on profile.
