from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field

app = FastAPI()


registered_users = []
class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


# Fake database
items = [
    {
        "name": "book",
        "description": "A book about FastAPI",
        "price": 50,
        "tax": 0.5
    },
    {
        "name": "pen",
        "description": "A pen for writing",
        "price": 5,
        "tax": 0
    }
]



@app.get("/items")
async def get_items():
    return items

@app.get("/items/{item_name}")
async def read_item(item_name: str):

    for item in items:
        if item["name"] == item_name:
            return item

    return {"message": "Item not found"}



@app.post("/items")
async def create_item(item: Item):

    new_item = {
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "tax": item.tax
    }

    items.append(new_item)

    return new_item


class User(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    email: EmailStr
    age: int = Field(ge=18, le=100)
    password: str = Field(min_length=8)


@app.post("/register")
async def register_user(user: User):
     
    registered_users.append(user)

    return {
        "message": "User registered successfully",
        "username": user.username,
        "email": user.email,
        "age": user.age
    }





from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field

app = FastAPI()


class User(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    email: EmailStr
    age: int = Field(ge=18, le=100)
    password: str = Field(min_length=8)


# Temporary storage
registered_users = []


@app.post("/register")
async def register_user(user: User):

    registered_users.append(user)

    return {
        "message": "User registered successfully",
        "username": user.username,
        "email": user.email,
        "age": user.age
    }


@app.get("/register")
async def get_registered_users():

    return registered_users



# from fastapi import FastAPI
# from pydantic import BaseModel

class Product(BaseModel):
    name: str
    price: float


products = [
    {"id": 1, "name": "Laptop", "price": 55000},
    {"id": 2, "name": "Mouse", "price": 800}
]


# GET
@app.get("/products")
async def get_products():
    return products


# PATH PARAMETER
@app.get("/products/{product_id}")
async def get_product(product_id: int):

    for product in products:
        if product["id"] == product_id:
            return product

    return {"message": "Product not found"}


# QUERY PARAMETER
@app.get("/search")
async def search_product(name: str):
    
    results = []

    for product in products:
        if name.lower() in product["name"].lower():
            results.append(product)

    return results

@app.get("/filter")
async def filter_product(price: float):
    results = []
    for product in products:
        if product["price"] >= price:
            results.append(product)

    return results
# REQUEST BODY
@app.post("/products")
async def create_product(product: Product):

    new_product = {
        "id": len(products) + 1,
        "name": product.name,
        "price": product.price
    }

    products.append(new_product)

    return new_product