from django.db import models

class Segment(models.Model):
    segment_code = models.CharField(max_length=50, unique=True)
    segment_info = models.TextField()

    def __str__(self):
        return self.segment_code


class Customer(models.Model):
    customer_code = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=100)
    segment = models.ForeignKey(Segment, on_delete=models.CASCADE)

    def __str__(self):
        return self.customer_code


class Category(models.Model):
    category_code = models.CharField(max_length=50, unique=True)
    category_name = models.TextField()

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_code = models.CharField(max_length=50, unique=True)
    product_name = models.TextField()
    price = models.IntegerField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    def __str__(self):
        return self.product_name


class Bill(models.Model):
    time_created = models.DateTimeField()
    bill_code = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)

    def __str__(self):
        return self.bill_code


class BillLine(models.Model):
    quantity = models.IntegerField()
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.bill.bill_code} - {self.product.product_name}"