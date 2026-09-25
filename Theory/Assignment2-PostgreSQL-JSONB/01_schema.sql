-- Assignment 2, Part B, Task 1 — schema: fixed typed columns plus one jsonb column.
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    category   VARCHAR(50)   NOT NULL,
    price      NUMERIC(10,2) NOT NULL,
    attributes JSONB
);

\d products
