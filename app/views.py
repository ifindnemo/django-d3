import csv
import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Segment, Customer, Category, Product, Bill, BillLine
from django.db.models import Sum, F, ExpressionWrapper, FloatField
import chardet
from django.db import transaction
from datetime import datetime
from django.utils import timezone


def home_view(request):
    return render(request, "home.html")

def import_csv(request):
    if request.method == 'POST' and request.FILES.get('file'):
        csv_file = request.FILES['file']
        if not csv_file.name.endswith('.csv'):
            return JsonResponse({'error': 'File phải là định dạng CSV'}, status=400)
        try:
            decoded_file = csv_file.read().decode('utf-8').splitlines()
            reader = csv.DictReader(decoded_file)

            segments = {}
            customers = {}
            categories = {}
            products = {}
            bills = {}
            bill_lines = []

            def safe_get(row, key, default=''):
                val = row.get(key, default)
                if val is None:
                    return default
                return val.strip()

            for i, row in enumerate(reader, start=1):
                print(i)
                segment_code = safe_get(row, 'Mã PKKH', 'UNKNOWN') or 'UNKNOWN'
                segment_info = safe_get(row, 'Mô tả Phân Khúc Khách hàng', '')
                if segment_code not in segments:
                    segments[segment_code] = Segment(segment_code=segment_code, segment_info=segment_info)

                customer_code = safe_get(row, 'Mã khách hàng')
                customer_name = safe_get(row, 'Tên khách hàng', 'Unknown')
                if customer_code and customer_code not in customers:
                    customers[customer_code] = Customer(customer_code=customer_code, segment=segments[segment_code], customer_name=customer_name)

                category_code = safe_get(row, 'Mã nhóm hàng', 'UNKNOWN')
                category_name = safe_get(row, 'Tên nhóm hàng', '')
                if category_code not in categories:
                    categories[category_code] = Category(category_code=category_code, category_name=category_name)

                product_code = safe_get(row, 'Mã mặt hàng', 'UNKNOWN')
                product_name = safe_get(row, 'Tên mặt hàng', '')
                try:
                    price = int(safe_get(row, 'Đơn giá', '0') or '0')
                except ValueError:
                    price = 0
                if product_code not in products:
                    # Gán tạm thời category (chưa lưu)
                    products[product_code] = Product(
                        product_code=product_code,
                        product_name=product_name,
                        price=price,
                        category=categories[category_code]
                    )

                bill_code = safe_get(row, 'Mã đơn hàng')
                time_str = safe_get(row, '\ufeff"Thời gian tạo đơn"')
                try:
                    time_created = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
                except ValueError as e:
                    print(f"Lỗi định dạng thời gian tại dòng {i}: {time_str}")
                    continue
                if bill_code and bill_code not in bills:
                    bills[bill_code] = Bill(bill_code=bill_code, time_created=time_created, customer=customers.get(safe_get(row, 'Mã khách hàng')))

                try:
                    quantity = int(safe_get(row, 'SL', '0') or '0')
                except ValueError:
                    quantity = 0
                if bill_code in bills and product_code in products:
                    bill_lines.append(BillLine(bill=bills[bill_code], product=products[product_code], quantity=quantity))

            with transaction.atomic():
                Segment.objects.bulk_create(segments.values(), ignore_conflicts=True)
                segment_map = {s.segment_code: s for s in Segment.objects.filter(segment_code__in=segments.keys())}

                for customer in customers.values():
                    saved_customer, _ = Customer.objects.update_or_create(
                        customer_code=customer.customer_code,
                        defaults={"segment": segment_map.get(customer.segment.segment_code), "customer_name": customer.customer_name}
                    )
                    customers[customer.customer_code] = saved_customer

                Category.objects.bulk_create(list(categories.values()), ignore_conflicts=True)
                category_map = {c.category_code: c for c in Category.objects.filter(category_code__in=categories.keys())}

                for product in products.values():
                    category = category_map.get(product.category.category_code)
                    Product.objects.update_or_create(
                        product_code=product.product_code,
                        defaults={'product_name': product.product_name, 'price': product.price, 'category': category}
                    )

                for bill in bills.values():
                    saved_bill, _ = Bill.objects.update_or_create(
                        bill_code=bill.bill_code,
                        defaults={"time_created": bill.time_created, "customer": customers.get(bill.customer.customer_code)}
                    )
                    bills[bill.bill_code] = saved_bill
                bill_map = {b.bill_code: b for b in Bill.objects.filter(bill_code__in=bills.keys())}

                for bill_line in bill_lines:
                    bill_obj = bill_map.get(bill_line.bill.bill_code)
                    product_obj = None
                    try:
                        product_obj = Product.objects.get(product_code=bill_line.product.product_code)
                    except Product.DoesNotExist:
                        print(f"Không tìm thấy Product với product_code: {bill_line.product.product_code}")
                        continue
                    BillLine.objects.update_or_create(
                        bill=bill_obj,
                        product=product_obj,
                        defaults={'quantity': bill_line.quantity}
                    )
                print("DONE!!!")

            return JsonResponse({'success': 'Du lieu da duoc nhap thanh cong! Khong co bug nao!'})

        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Phương thức không hợp lệ!'}, status=400)

def get_chart_data(request):
    revenue = ExpressionWrapper(
    F("quantity") * F("product__price"),
    output_field=FloatField()
    )

    data = (
        BillLine.objects
        .select_related("bill__customer", "product__category")
        .values(
            "bill__bill_code",
            "bill__customer__customer_code",
            "bill__time_created",
            "product__product_code",
            "product__product_name",
            "product__category__category_code",
            "product__category__category_name",
        )
        .annotate(
            SL=Sum("quantity"),
            revenue=Sum(revenue)
        )
    )

    formatted_data = [
        {
            "Mã đơn hàng": item["bill__bill_code"],
            "Mã khách hàng": item["bill__customer__customer_code"],
            "Thời gian tạo đơn": item["bill__time_created"].strftime("%Y-%m-%d %H:%M:%S") if item["bill__time_created"] else "",
            "Mã mặt hàng": item["product__product_code"],
            "Tên mặt hàng": item["product__product_name"],
            "Mã nhóm hàng": item["product__category__category_code"],
            "Tên nhóm hàng": item["product__category__category_name"],
            "SL": item["SL"],
            "Thành tiền": item["revenue"],
        }
        for item in data
    ]

    print(formatted_data[:2])
    return JsonResponse(formatted_data, safe=False)

def nhapdulieu(request):
    return render(request, "nhapdulieu.html")

def inputform(request):
    if request.method == 'POST':
        try:
            ma_don_hang = request.POST.get('ma_don_hang')
            ma_khach_hang = request.POST.get('ma_khach_hang')
            ten_khach_hang = request.POST.get('ten_khach_hang')
            ma_pkkh = request.POST.get('ma_pkkh')
            mo_ta_pkkh = request.POST.get('mo_ta_pkkh')
            thoi_gian_tao_don = request.POST.get('thoi_gian_tao_don')
            ma_nhom_hang = request.POST.get('ma_nhom_hang')
            ten_nhom_hang = request.POST.get('ten_nhom_hang')
            ma_mat_hang = request.POST.get('ma_mat_hang')
            ten_mat_hang = request.POST.get('ten_mat_hang')
            so_luong = int(request.POST.get('so_luong', 0))
            thanh_tien = int(request.POST.get('thanh_tien', 0))

            segment, _ = Segment.objects.get_or_create(
                segment_code=ma_pkkh,
                defaults={'segment_info': mo_ta_pkkh}
            )

            customer, created = Customer.objects.get_or_create(
                customer_code=ma_khach_hang,
                defaults={
                    'customer_name': ten_khach_hang,
                    'segment': segment
                }
            )
            
            if not created and customer.customer_name != ten_khach_hang:
                customer.customer_name = ten_khach_hang
                customer.segment = segment
                customer.save()

            category, _ = Category.objects.get_or_create(
                category_code=ma_nhom_hang,
                defaults={'category_name': ten_nhom_hang}
            )

            product, _ = Product.objects.get_or_create(
                product_code=ma_mat_hang,
                defaults={
                    'product_name': ten_mat_hang,
                    'price': thanh_tien,
                    'category': category
                }
            )

            bill = Bill.objects.create(
                time_created=thoi_gian_tao_don or timezone.now(),
                bill_code=ma_don_hang,
                customer=customer
            )

            BillLine.objects.create(
                quantity=so_luong,
                bill=bill,
                product=product
            )

            return JsonResponse({'success': 'Du lieu da duoc nhap thanh cong! Khong co bug nao!'})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return render(request, 'nhapdulieu.html')