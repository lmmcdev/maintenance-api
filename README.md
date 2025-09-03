# Maintenance API

This project provides a REST API for managing maintenance operations, including categories, subcategories, persons, and tickets. It is built to run on Azure Functions and exposes versioned endpoints under `/api/v1`.

---

## 📋 API Endpoints

### Health

- **Check Service Health**
  - `GET /api/v1/health`

---

### Categories

- **Create Category**  
  `POST /api/v1/categories`

  **Request Example**

  ```json
  {
    "name": "PREVENTIVE",
    "description": "Tasks to prevent failures"
  }
  ```

  **Response Example**

  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "PREVENTIVE",
    "description": "Tasks to prevent failures",
    "createdAt": "2025-09-03T10:00:00Z"
  }
  ```

- **Delete Category**  
  `DELETE /api/v1/categories/{id}`

- **Get Category by ID**  
  `GET /api/v1/categories/{id}`

- **List Categories**  
  `GET /api/v1/categories`

- **Seed Categories (bulk insert)**  
  `POST /api/v1/categories/seed`

- **Update Category**  
  `PATCH /api/v1/categories/{id}`

---

### Subcategories

- **Add Subcategory to Category**  
  `POST /api/v1/categories/{id}/subcategories`

  **Request Example**

  ```json
  {
    "name": "PAINTING",
    "displayName": "Pintado de paredes"
  }
  ```

- **Delete Subcategory**  
  `DELETE /api/v1/categories/{id}/subcategories/{name}`

- **Update Subcategory**  
  `PATCH /api/v1/categories/{id}/subcategories/{name}`

---

### Persons

- **Create Person**  
  `POST /api/v1/persons`

  **Request Example**

  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "17863332222",
    "email": "john.doe@example.com",
    "role": "technician"
  }
  ```

  **Response Example**

  ```json
  {
    "id": "4a1e2b63-63fc-4e6f-b156-377b84eda6b1",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "17863332222",
    "email": "john.doe@example.com",
    "role": "technician",
    "createdAt": "2025-09-03T10:10:00Z"
  }
  ```

- **Delete Person by ID**  
  `DELETE /api/v1/persons/{id}`

- **Get Person by ID**  
  `GET /api/v1/persons/{id}`

- **List Persons**  
  `GET /api/v1/persons`

- **Update Person by ID**  
  `PATCH /api/v1/persons/{id}`

---

### Tickets

- **Create Ticket**  
  `POST /api/v1/tickets`

  **Request Example**

  ```json
  {
    "title": "Air conditioning repair",
    "description": "AC not cooling properly",
    "status": "NEW",
    "priority": "HIGH",
    "category": "CORRECTIVE",
    "assigneeId": "4a1e2b63-63fc-4e6f-b156-377b84eda6b1"
  }
  ```

  **Response Example**

  ```json
  {
    "id": "56a1ef63-63fc-4e6f-b156-377b84eda6b1",
    "title": "Air conditioning repair",
    "description": "AC not cooling properly",
    "status": "NEW",
    "priority": "HIGH",
    "category": "CORRECTIVE",
    "assigneeId": "4a1e2b63-63fc-4e6f-b156-377b84eda6b1",
    "createdAt": "2025-09-03T10:15:00Z"
  }
  ```

- **Delete Ticket by ID**  
  `DELETE /api/v1/tickets/{id}`

- **Get Ticket by ID**  
  `GET /api/v1/tickets/{id}`

- **List Tickets**  
  `GET /api/v1/tickets`

- **Update Ticket**  
  `PATCH /api/v1/tickets/{id}`

- **Update Ticket Status**  
  `PATCH /api/v1/tickets/{id}/status`

---

## ⚙️ Setup

### Prerequisites

- Node.js v18+
- Azure Functions Core Tools
- Cosmos DB or SQL database (depending on configuration)

### Installation

```bash
npm install
```

### Local Development

```bash
npm run start
```

Runs the API locally at `http://localhost:7071`.

---

## 📦 Deployment

Deploy to Azure Functions:

```bash
func azure functionapp publish <APP_NAME>
```

---

## 🔑 Environment Variables

| Variable             | Description                                 |
| -------------------- | ------------------------------------------- |
| `COSMOS_DB_ENDPOINT` | Cosmos DB endpoint URL                      |
| `COSMOS_DB_KEY`      | Cosmos DB access key                        |
| `COSMOS_DB_NAME`     | Cosmos DB Name                              |
| `NODE_ENV`           | Environment (development, production, etc.) |
