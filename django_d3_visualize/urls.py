"""
URL configuration for django_d3_visualize project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from django.urls import path
from app.views import home_view, import_csv, get_chart_data, nhapdulieu, inputform

urlpatterns = [
    path("", home_view, name="home"),  # Trang chủ
    path("import/", import_csv, name="import_csv"),
    path('get_chart_data/', get_chart_data, name='get_chart_data'),
    path('admin/', admin.site.urls),
    path('nhapdulieu/', nhapdulieu, name='nhapdulieu'),
    path('inputform/', inputform, name='inputform'),
    
]