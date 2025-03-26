let drawChart1, drawChart2, drawChart3, drawChart4, drawChart5, drawChart6, drawChart7, drawChart8, drawChart9, drawChart10, drawChart11, drawChart12;

const tableauClassic10 = [
  "#4E79A7", // Xanh dương
  "#F28E2B", // Cam
  "#E15759", // Đỏ
  "#76B7B2", // Xanh nước biển
  "#59A14F", // Xanh lá
  "#EDC948", // Vàng
  "#B07AA1", // Tím
  "#FF9DA7", // Hồng
  "#9C755F", // Nâu
  "#BAB0AC", // Xám
];

const tableauClassic20 = [
  "#4E79A7", "#A0CBE8", // Xanh dương
  "#F28E2B", "#FFBE7D", // Cam
  "#59A14F", "#8CD17D", // Xanh lá
  "#B6992D", "#F1CE63", // Vàng
  "#499894", "#86BCB6", // Xanh nước biển
  "#E15759", "#FF9D9A", // Đỏ
  "#79706E", "#BAB0AC", // Xám
  "#D37295", "#FFB7D5", // Hồng
  "#B07AA1", "#D4A6C8", // Tím
  "#9D7660", "#D7B5A6"  // Nâu
];

const tableauClassic40 = [
  "#4E79A7", "#A0CBE8", "#1F77B4", "#6BAED6", // Xanh dương
  "#F28E2B", "#FFBE7D", "#FF7F0E", "#FDB863", // Cam
  "#59A14F", "#8CD17D", "#2CA02C", "#66C2A5", // Xanh lá
  "#B6992D", "#F1CE63", "#BCBD22", "#FFD92F", // Vàng
  "#499894", "#86BCB6", "#17BECF", "#74C476", // Xanh nước biển
  "#E15759", "#FF9D9A", "#D62728", "#E41A1C", // Đỏ
  "#79706E", "#BAB0AC", "#7F7F7F", "#999999", // Xám
  "#D37295", "#FFB7D5", "#E377C2", "#FDA4D4", // Hồng
  "#B07AA1", "#D4A6C8", "#9467BD", "#BC80BD", // Tím
  "#9D7660", "#D7B5A6", "#8C564B", "#D9A679"  // Nâu
];

const selector = d3.select("#chartSelector");
const chartDiv = d3.select("#chart");
const bigchartDiv = d3.select("#bigchart");

function clearChart() {
  chartDiv.select("svg").remove();
  bigchartDiv.selectAll("svg").remove();
  bigchartDiv.selectAll("h3").remove();
  bigchartDiv.selectAll('[id^="chart9-container-"]').remove();
  bigchartDiv.selectAll('[id^="chart10-container-"]').remove();
  bigchartDiv.attr("style", null);
}

function formatVND(value) {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(".", ",") + " tr";
  }
  return value.toLocaleString("vi-VN");
}

fetch("{% url 'get_chart_data' %}")
  .then(response => response.json())
  .then(function (data) {
    // Chuyển đổi dữ liệu
    data.forEach(d => {
      d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
      d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
      d["Tháng"] = `Tháng ${d3.timeFormat("%m")(new Date(d["Thời gian tạo đơn"]))}`;
      d["ThángQ10"] = `T${d3.timeFormat("%m")(new Date(d["Thời gian tạo đơn"]))}`;
    });
  console.log("data: ",data)
  // Q1: Doanh số bán hàng theo Mặt hàng
  drawChart1 = function() {
    clearChart();

    const revenueByItem = d3.rollup(
      data,
      (v) => ({
        revenue: d3.sum(v, (d) => +d["Thành tiền"]),
        group: v[0]["Nhóm hàng"],
        orderCount: d3.sum(v, (d) => +d["SL"])
      }),
      (d) => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
    );

    const dataset = Array.from(revenueByItem, ([item, { revenue, group, orderCount }]) => ({
      item,
      revenue,
      group,
      orderCount
    })).sort((a, b) => d3.descending(a.revenue, b.revenue));

    Ve_Chart_Ngang(dataset, "Q1");
  }

  // Q2: Doanh số bán hàng theo Nhóm hàng
  drawChart2 = function() {
    clearChart();

    const revenueByGroup = d3.rollup(
      data,
      (v) => ({
        revenue: d3.sum(v, (d) => +d["Thành tiền"]),
        orderCount: d3.sum(v, (d) => +d["SL"]),
      }),
      (d) => d["Nhóm hàng"]
    );

    const dataset = Array.from(revenueByGroup, ([group, { revenue, orderCount }]) => ({
      item: group,
      revenue,
      orderCount,
      group,
    })).sort((a, b) => d3.descending(a.revenue, b.revenue));

    Ve_Chart_Ngang(dataset, "Q2");
  }

  // Q3: Doanh số bán hàng theo Tháng
  drawChart3 = function() {
    clearChart();
  
    const revenueByMonth = d3.rollup(
      data,
      (v) => ({
        revenue: d3.sum(v, (d) => +d["Thành tiền"]),
        orderCount: d3.sum(v, (d) => +d["SL"]),
      }),
      (d) => d["Tháng"]
    );
  
    const dataset = Array.from(revenueByMonth, ([month, { revenue, orderCount }]) => ({
      item: month,
      revenue,
      orderCount,
      group: "Tháng",
    })).sort((a, b) => d3.ascending(a.item, b.item));
  
    Ve_Chart_Doc(dataset, "Q3");
  }

  // Q4: Doanh số bán hàng trung bình theo Ngày trong tuần
  drawChart4 = function() {
    clearChart();

    const formatDayOfWeek = d3.timeFormat("%A");

    const dayMapping = {
        "Monday": "Thứ hai",
        "Tuesday": "Thứ ba",
        "Wednesday": "Thứ tư",
        "Thursday": "Thứ năm",
        "Friday": "Thứ sáu",
        "Saturday": "Thứ bảy",
        "Sunday": "Chủ nhật"
    };

    const parseDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    const revenueByDayOfWeek = d3.rollup(
        data,
        (v) => {
            const totalRevenue = d3.sum(v, (d) => +d["Thành tiền"]);

            const orderCount = d3.sum(v, (d) => +d["SL"]);

            const uniqueDays = new Set(v.map(d => parseDate(d["Thời gian tạo đơn"]))).size;

            return {
              avgRevenue: uniqueDays > 0 ? totalRevenue / uniqueDays : 0,
              orderCount: uniqueDays > 0 ? orderCount / uniqueDays : 0
          };

        },
        (d) => dayMapping[formatDayOfWeek(new Date(d["Thời gian tạo đơn"]))]
    );

    const dayOrder = {
        "Thứ hai": 1,
        "Thứ ba": 2,
        "Thứ tư": 3,
        "Thứ năm": 4,
        "Thứ sáu": 5,
        "Thứ bảy": 6,
        "Chủ nhật": 7
    };

    const dataset = Array.from(revenueByDayOfWeek, ([day, { avgRevenue, orderCount }]) => ({
        item: day,
        revenue: avgRevenue,
        orderCount: orderCount,
        group: "Ngày trong tuần",
    })).sort((a, b) => dayOrder[a.item] - dayOrder[b.item]);
    
    Ve_Chart_Doc(dataset, "Q4");
  }
  
  // Q5: Doanh số bán hàng trung bình theo Ngày trong tháng
  drawChart5 = function() {
    clearChart();

    // Hàm lấy ngày trong tháng (01, 02, ..., 31)
    const getDayOfMonth = (dateString) => {
        const date = new Date(dateString);
        return `Ngày ${String(date.getDate()).padStart(2, '0')}`;
    };

    const parseDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    const revenueByDayOfMonth = d3.rollup(
        data,
        (v) => {
            const totalRevenue = d3.sum(v, (d) => +d["Thành tiền"]);

            const orderCount = d3.sum(v, (d) => +d["SL"]);

            const uniqueDays = new Set(v.map(d => parseDate(d["Thời gian tạo đơn"]))).size;

            return {
                avgRevenue: uniqueDays > 0 ? totalRevenue / uniqueDays : 0,
                orderCount: uniqueDays > 0 ? orderCount / uniqueDays : 0
            };
        },
        (d) => getDayOfMonth(d["Thời gian tạo đơn"])
    );

    const dataset = Array.from(revenueByDayOfMonth, ([day, { avgRevenue, orderCount }]) => ({
        item: day,
        revenue: avgRevenue,
        orderCount: orderCount,
        group: "Ngày trong tháng",
    })).sort((a, b) => a.item.localeCompare(b.item, undefined, { numeric: true }));

    Ve_Chart_Doc(dataset, "Q5");
  }

  // Q6: Doanh số bán hàng trung bình theo Khung giờ
  drawChart6 = function() {
    clearChart();

    const getTimeRange = (dateString) => {
        const date = new Date(dateString);
        const hour = date.getHours();
        const startHour = String(hour).padStart(2, '0');
        const endHour = String(hour + 1).padStart(2, '0');
        return `${startHour}:00-${endHour}:00`;
    };

    const parseDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    const revenueByTimeRange = d3.rollup(
        data,
        (v) => {
            const totalRevenue = d3.sum(v, (d) => +d["Thành tiền"]);

            const orderCount = d3.sum(v, (d) => +d["SL"]);

            const uniqueDays = new Set(v.map(d => parseDate(d["Thời gian tạo đơn"]))).size;

            return {
                avgRevenue: uniqueDays > 0 ? totalRevenue / uniqueDays : 0,
                orderCount: uniqueDays > 0 ? orderCount / uniqueDays : 0
            };
        },
        (d) => getTimeRange(d["Thời gian tạo đơn"])
    );

    const timeRanges = Array.from({ length: 16 }, (_, i) => {
        const startHour = String(i + 8).padStart(2, '0');
        const endHour = String(i + 9).padStart(2, '0');
        return `${startHour}:00-${endHour}:00`;
    });

    const dataset = timeRanges.map((timeRange) => {
        const stats = revenueByTimeRange.get(timeRange) || { avgRevenue: 0, orderCount: 0 };
        return {
            item: timeRange, 
            revenue: stats.avgRevenue,
            orderCount: stats.orderCount,
            group: "Khung giờ",
        };
    });

    Ve_Chart_Doc(dataset, "Q6");
  }

  // Q7: Xác suất bán hàng theo Nhóm hàng
  drawChart7 = function() {
    clearChart();
    
    const totalOrders = new Set(data.map(d => d["Mã đơn hàng"])).size;
  
    const probabilityByGroup = d3.rollup(
      data,
      (v) => {
        const uniqueOrders = new Set(v.map(d => d["Mã đơn hàng"])).size;
  
        return {
          probability: uniqueOrders / totalOrders,
          orderCount: uniqueOrders
        };
      },
      (d) => d["Nhóm hàng"]
    );
  
    const dataset = Array.from(probabilityByGroup, ([group, { probability, orderCount }]) => ({
      item: group,
      revenue: probability,
      revenueFormatted: (probability * 100).toFixed(1) + "%",
      orderCount: orderCount,
      group: group
    })).sort((a, b) => d3.descending(a.revenue, b.revenue));
  
    Ve_Chart_Ngang(dataset, "Q7");
  }

  // Q8: Xác suất bán hàng theo Nhóm hàng theo Tháng
  drawChart8 = function() {
    clearChart();
    const totalOrdersByMonth = d3.rollup(
      data,
      (v) => new Set(v.map((d) => d["Mã đơn hàng"])).size,
      (d) => d["Tháng"]
    );

    const probabilityByGroupAndMonth = d3.rollup(
      data,
      (v) => {
        const uniqueOrders = new Set(v.map((d) => d["Mã đơn hàng"])).size;
        const month = v[0]["Tháng"];
        const probability = uniqueOrders / totalOrdersByMonth.get(month);
        return { probability, orderCount: uniqueOrders };
      },
      (d) => d["Nhóm hàng"],
      (d) => d["Tháng"]
    );

    const dataset = Array.from(probabilityByGroupAndMonth, ([group, months]) => {
      return {
        group,
        values: Array.from(months, ([month, { probability, orderCount }]) => ({
          month,
          probability,
          probabilityFormatted: (probability * 100).toFixed(1) + "%",
          orderCount,
        })).sort((a, b) => d3.ascending(a.month, b.month)),
      };
    });

    Ve_chart_Q8(dataset, "Q8");
  }

  // Q9: Xác suất bán hàng của Mặt hàng theo Nhóm hàng
  drawChart9 = function() {
    clearChart();
    const totalOrdersByGroup = d3.rollup(
      data,
      (v) => new Set(v.map(d => d["Mã đơn hàng"])).size,
      (d) => d["Nhóm hàng"]
    );

    const probabilityByItem = d3.rollup(
      data,
      (v) => {
        const group = v[0]["Nhóm hàng"];
        const uniqueOrders = new Set(v.map(d => d["Mã đơn hàng"])).size;

        return uniqueOrders / totalOrdersByGroup.get(group);
      },
      (d) => d["Nhóm hàng"],
      (d) => d["Mặt hàng"]
    );

    const dataset = Array.from(probabilityByItem, ([group, items]) => {
      return {
        group: group,
        items: Array.from(items, ([item, probability]) => ({
          item: item,
          revenue: probability,
          revenueFormatted: (probability * 100).toFixed(1) + "%",
          group: group
        })).sort((a, b) => d3.descending(a.revenue, b.revenue))
      };
    });

    d3.select("#bigchart")
      .style("width", "1800px")
      .style("height", "900px")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(3, 1fr)")
      .style("grid-template-rows", "repeat(2, 1fr)")
      .style("gap", "10px");

    const topGroups = d3.groups(data, d => d["Nhóm hàng"])
                        .sort((a, b) => d3.descending(d3.sum(a[1], d => d.revenue), d3.sum(a[1], d => d.revenue)))
                        .slice(0, 5);

    allItems = Array.from(new Set(dataset.flatMap(d => d.items.map(item => item.item))));

    colorScale = d3.scaleOrdinal(tableauClassic20).domain(allItems);

    topGroups.forEach((groupData, index) => {
      const containerId = `chart9-container-${index}`;

      const chartContainer = d3.select("#bigchart")
        .append("div")
        .attr("id", containerId)
        .style("border", "1px solid #ccc")
        .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.1)")
        .style("border-radius", "8px")
        .style("padding", "10px");

      const chartData = dataset.find(d => d.group === groupData[0]).items;

      Ve_Chart_Q9(chartData, "Q9", containerId, colorScale);
    });
  }

  // Q10: Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo Tháng
  drawChart10 = function() {
    clearChart();
    const totalOrdersByGroupMonth = d3.rollup(
      data,
      (v) => new Set(v.map((d) => d["Mã đơn hàng"])).size,
      (d) => d["Nhóm hàng"],
      (d) => d["ThángQ10"]
    );
  
    const XacSuatTheoMHNH_Thang = d3.rollup(
      data,
      (v) => {
        const uniqueOrders = new Set(v.map((d) => d["Mã đơn hàng"])).size;
        const month = v[0]["ThángQ10"];
        const group = v[0]["Nhóm hàng"];

        const totalOrders = totalOrdersByGroupMonth.get(group).get(month) || 1;
        const probability = uniqueOrders / totalOrders;
        return { probability, orderCount: uniqueOrders };
      },
      (d) => d["Nhóm hàng"],
      (d) => d["Mặt hàng"],
      (d) => d["ThángQ10"]
    );

    d3.select("#bigchart")
      .style("width", "1800px")
      .style("height", "900px")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(3, 1fr)")
      .style("grid-template-rows", "repeat(2, 1fr)")
      .style("gap", "10px");
  
    const topGroups = d3.groups(data, (d) => d["Nhóm hàng"])
      .sort((a, b) => d3.descending(d3.sum(a[1], (d) => d.revenue), d3.sum(b[1], (d) => d.revenue)))
      .slice(0, 5)
      .map((d) => d[0]);
    
    const dataset = Array.from(XacSuatTheoMHNH_Thang, ([group, items]) => {
      return {
        group,
        items: Array.from(items, ([item, months]) => ({
          item,
          values: Array.from(months, ([month, { probability, orderCount }]) => ({
            month,
            probability,
            probabilityFormatted: (probability * 100).toFixed(1) + "%",
            orderCount,
          })).sort((a, b) => d3.ascending(a.month, b.month)),
        })),
      };
    }).filter((d) => topGroups.includes(d.group));
  
    allItems = Array.from(new Set(dataset.flatMap(d => d.items.map(item => item.item))))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    colorScale = d3.scaleOrdinal(tableauClassic20).domain(allItems);
    
    topGroups.forEach((groupData, index) => {
      const containerId = `chart10-container-${index}`;

      const chartContainer = d3.select("#bigchart")
        .append("div")
        .attr("id", containerId)
        .style("border", "1px solid #ccc")
        .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.1)")
        .style("border-radius", "8px")
        .style("padding", "10px");

      const chartData = dataset.find(d => d.group === groupData).items;

      Ve_Chart_Q10(chartData, "Q10", containerId, colorScale, groupData);
    });
  };

  // Q11: Phân phối Lượt mua hàng
  drawChart11 = function() {
    clearChart();

    const purchasesByCustomer = d3.rollup(
      data,
      (v) => new Set(v.map(d => d["Mã đơn hàng"])).size,
      (d) => d["Mã khách hàng"]
    );

    const purchaseFrequency = d3.rollup(
      Array.from(purchasesByCustomer.values()),
      (v) => v.length,
      (count) => count
    );

    const dataset = Array.from(purchaseFrequency, ([purchases, customers]) => ({
      item: purchases,
      customers,
      group: "Số lần mua"
    })).sort((a, b) => d3.ascending(a.item, b.item));

    VeChart_11_12(dataset, "Q11");
  }

  // Q12: Phân phối Mức chi trả của Khách hàng
  drawChart12 = function() {
    clearChart();

    const spendingByCustomer = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d["Thành tiền"]),
      (d) => d["Mã khách hàng"]
    );

    const binSize = 50000;
    const binnedData = d3.rollup(
      Array.from(spendingByCustomer.values()),
      (v) => v.length,
      (amount) => Math.floor(amount / binSize) * binSize
    );

    const dataset = Array.from(binnedData, ([spending, customers]) => ({
      item: spending,
      customers: customers,
      group: "Mức chi trả"
    })).sort((a, b) => d3.ascending(a.item, b.item));

    VeChart_11_12(dataset, "Q12");
  };

  //================================================================================================
  // Hàm vẽ biểu đồ ngang cho Q1, Q2, Q7
  function Ve_Chart_Ngang(dataset, chartType) {
    const margin = { top: 20, right: 40, bottom: 40, left: 220 };
    const width = 1000;
    const height = 600;

    const svg = chartDiv
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const y = d3.scaleBand()
      .domain(dataset.map((d) => d.item))
      .range([0, height])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, (d) => d.revenue) * 1.15])
      .range([0, width - 200]);

    const colorScale = d3.scaleOrdinal()
      .domain(chartType === "Q1" || chartType === "Q2"
        ? Array.from(new Set(dataset.map((d) => d.group))).sort(d3.ascending)
        : chartType === "Q7"
        ? Array.from(new Set(data.map((d) => d["Nhóm hàng"])))
        : Array.from(new Set(dataset.map(d => d.group)))
      )
      .range(tableauClassic10);

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
      .attr("class", "axis-label");

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => {
        if (chartType === "Q7") {
          return d3.format(".0%")(d);
        }
        if (d < 1000) return d;
        if (d < 1000000) return (d / 1000) + "K";
        if (d < 1000000000) return (d / 1000000) + "M";
        return (d / 1000000000) + "B";
      }))

    svg.selectAll("line.vertical-grid")
      .data(x.ticks())
      .enter()
      .append("line")
      .attr("class", "vertical-grid")
      .attr("x1", (d) => x(d))
      .attr("y1", 0)
      .attr("x2", (d) => x(d))
      .attr("y2", height)
      .style("stroke", "gray")
      .style("opacity", 0.2);
    

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px");

    svg.selectAll(".bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.item))
      .attr("width", (d) => x(d.revenue))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => chartType === "Q7" ? colorScale(d.item) : colorScale(d.group))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`${chartType === "Q1" ? `<strong>Mặt hàng:</strong> ${d.item}<br>` : ""}
                 <strong>Nhóm hàng:</strong> ${d.group}<br>
                 ${chartType === "Q7" ? `<strong>Xác suất Bán:</strong> ${d.revenueFormatted}<br>` : `<strong>Doanh số:</strong> ${d3.format(",.0f")(d.revenue/1000000)} triệu VND<br>`}
                 <strong>SL Đơn bán:</strong> ${d3.format(",.0f")(d.orderCount)} SKUs`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 20}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg.selectAll(".label")
      .data(dataset)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.revenue) + 5)
      .attr("y", (d) => y(d.item) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .style("font-size", "10px")
      .text((d) => chartType === "Q7" ? d.revenueFormatted : `${d3.format(",.0f")(d.revenue / 1000000)} triệu VND`);


    if (chartType === "Q1") {
      const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("transform", "translate(0, 50)")
        .selectAll("g")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

      legend.append("rect")
        .attr("x", width - 100)
        .attr("y", -50)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", colorScale);

      legend.append("text")
        .attr("x", width - 75)
        .attr("y", 9.5-50)
        .attr("dy", "0.32em")
        .text((d) => d);
    }
  }

  //===================================================================================================
  // Hàm vẽ biểu đồ dọc cho Q3, Q4, Q5, Q6
  function Ve_Chart_Doc(dataset, chartType) {
    clearChart();
    const margin = { top: 20, right: 20, bottom: 40, left: 80 };
    const width = 1100;
    const height = 600;

    const svg = chartDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataset.map(d => d.item))
      .range([0, width])
      .padding(0.2);

    
    const y = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.revenue)])
      .range([height, 0]);

    const selectedColors = chartType === "Q5"
      ? tableauClassic40
      : (chartType === "Q3" || chartType === "Q6" ? tableauClassic20 : tableauClassic10);

    const colorScale = d3.scaleOrdinal()
      .domain(dataset.map(d => d.item))
      .range(selectedColors);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat((d) => {
          if (d < 1000) return d;
          if (d < 1000000) return (d / 1000) + "K";
          if (d < 1000000000) return (d / 1000000) + "M";
          return (d / 1000000000) + "B";
      }));

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", chartType === "Q5" ? "rotate(-45)" : "rotate(0)")
      .style("text-anchor", chartType === "Q5" ? "end" : "middle");

    svg.selectAll("line.horizontal-grid")
      .data(y.ticks())
      .enter()
      .append("line")
      .attr("class", "horizontal-grid")
      .attr("x1", 0)
      .attr("y1", (d) => y(d))
      .attr("x2", width)
      .attr("y2", (d) => y(d))
      .style("stroke", "gray")
      .style("opacity", 0.2);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px");
    
    svg.selectAll(".bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", d => x(d.item))
      .attr("y", d => y(d.revenue)) 
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.revenue))
      .attr("fill", (d) => colorScale(d.item))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`${chartType === "Q3" ? `<strong>${d.item}</strong><br> <strong>Doanh số:</strong> ${d3.format(",.0f")(d.revenue/1000000)} triệu VND<br>` : ""}
                 ${chartType === "Q4" ? `<strong>${d.item}</strong><br> <strong>Doanh số:</strong> ${d3.format(",.0f")(d.revenue)} VND<br>` : ""}
                 ${chartType === "Q5" ? `<strong>${d.item}</strong><br> <strong>Doanh số:</strong> ${formatVND(d.revenue)}<br>` : ""}
                 ${chartType === "Q6" ? `<strong>Khung giờ ${d.item}</strong><br><strong>Doanh số:</strong> ${d3.format(",.0f")(d.revenue)} VND<br>` : ""}
                 <strong>Số lượng bán:</strong> ${d3.format(",.0f")(d.orderCount)} SKUs`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 20}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
      
      svg.selectAll(".label")
      .data(dataset)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.item) + x.bandwidth() / 2)
      .attr("y", d => y(d.revenue) - 5)
      .attr("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "10px")
      .text(d => {
        if (chartType === "Q3") {
          return `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND`;
        } else if (chartType === "Q5") {
          return formatVND(d.revenue);
        }
        return `${d3.format(",.0f")(d.revenue)} VND`;
    });
  }

  //===================================================================================================
  function Ve_chart_Q8(dataset, chartType) {
    // Kích thước biểu đồ
    const margin = { top: 40, right: 210, bottom: 50, left: 70 },
          width = 1000
          height = 600

    d3.select("#chart").selectAll("*").remove();

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const months = dataset[0].values.map(d => d.month);

    const x = d3.scalePoint()
      .domain(months)
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d3.max(d.values, v => v.probability)) * 1.1])
      .range([height, 0]);

    const sortedGroups = dataset.map(d => d.group).sort(d3.ascending);

    const colorScale = d3.scaleOrdinal()
      .domain(sortedGroups)
      .range(d3.schemeTableau10);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px");

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${(d * 100).toFixed(0)}%`))
      .selectAll("text")
      .style("font-size", "12px");

    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.probability));

    svg.selectAll(".line")
      .data(dataset)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d => colorScale(d.group))
      .attr("stroke-width", 2)
      .attr("d", d => line(d.values));

    const legend = svg.selectAll(".legend")
      .data(sortedGroups)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width + 40}, ${i * 25})`);

      legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => colorScale(d));

      legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text(d => d);

    svg.selectAll(".y-grid")
      .data(y.ticks())
      .enter()
      .append("line")
      .attr("class", "y-grid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#000")
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.2);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px");

    svg.selectAll(".dot")
      .data(dataset.flatMap(d => d.values.map(v => ({ group: d.group, ...v }))))
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.probability))
      .attr("r", 4)
      .style("fill", d => colorScale(d.group))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`<strong>Nhóm hàng:</strong> ${d.group}<br>
                 <strong>Tháng:</strong> ${d.month}<br>
                 <strong>Xác suất theo tháng:</strong> ${(d.probability * 100).toFixed(1)}%<br>
                 <strong>Số lượng đơn:</strong> ${d.orderCount}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 20}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
  }

  //===================================================================================================
  function Ve_Chart_Q9(dataset, chartType, containerId, colorScale) {
    d3.select(`#${containerId}`).html("");

    const margin = { top: 40, right: 1, bottom: 50, left: 200 },
          width = 360
          height = 300
        
    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(dataset.map(d => d.item))
      .range([0, height])
      .padding(0.3);

    const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.revenue)])
      .range([0, width-70]);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ddd")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("opacity", 0);

    svg.selectAll(".bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.item))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.revenue))
      .attr("fill", d => colorScale(d.item))
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<strong>Mặt hàng: </strong>${d.item}<br>
                 <strong>Nhóm hàng: </strong>${dataset[0].group}
                 <br><strong>SL Đơn bán: </strong>${d.orderCount}
                 <br><strong>Xác suất Bán / Nhóm hàng: </strong>${d.revenueFormatted}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

    svg.append("text")
    .attr("x", width / 4)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#4E79A7")
    .text(`${dataset[0].group}`);
  } 

  //===================================================================================================
  function Ve_Chart_Q10(dataset, chartType, containerId, colorScale, groupData) {
    d3.select(`#${containerId}`).html("");
    const margin = { top: 40, right: 1, bottom: 50, left: 1 },
          width = 470
          height = 270
  
    d3.select(`#${containerId}`).html("");

    const chartContainer = d3.select(`#${containerId}`)
      .append("div")
      .attr("class", "chart-wrapper")
      .style("display", "inline-block")
      .style("margin", "20px");

    const svg = chartContainer
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(dataset[0].values.map(d => d.month))
      .range([50, 450]);

    const y = d3.scaleLinear()
    .domain([
      d3.max(dataset, d => d3.max(d.values, v => v.probability)) *
      (groupData === "[BOT] Bột" ? 0.9 : 0.3),
      d3.max(dataset, d => d3.max(d.values, v => v.probability)) * 1.1
    ])
    .range([250, 50]);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "8px");

    svg.append("g")
      .attr("transform", `translate(40, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d * 100).toFixed(0)}%`))
      .selectAll("text")
      .style("font-size", "8px");

        console.log(dataset);
        console.log(dataset.items);

    dataset.forEach((item, index) => {
      const color = colorScale(item.item);

      const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.probability));

      svg.selectAll(".line")
        .data(dataset)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.item))
        .attr("stroke-width", 2)
        .attr("d", d => line(d.values));

      svg.selectAll(".y-grid")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("class", "y-grid")
        .attr("x1", 40)
        .attr("x2", width + 40)
        .attr("y1", d => y(d) + 10)
        .attr("y2", d => y(d) + 10)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.8)
        .attr("opacity", 0.2)
        .attr("transform", `translate(0, -10)`);


      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px");

      svg.selectAll(`.dot-${index}`)
          .data(item.values)
          .enter()
          .append("circle")
          .attr("class", `dot-${index}`)
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.probability))
          .attr("r", 4)
          .attr("fill", color)
          .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
              .html(`<strong>Mặt hàng:</strong> ${item.item}<br>
                     <strong>Nhóm hàng:</strong> ${groupData}<br>
                     <strong>Tháng:</strong> ${d.month}<br>
                     <strong>Xác suất Bán / Nhóm hàng:</strong> ${(d.probability * 100).toFixed(1)}%<br>
                     <strong>SL Đơn bán:</strong> ${d.orderCount}`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 20}px`).style("left", `${event.pageX + 10}px`);
          })
          .on("mouseout", () => tooltip.style("visibility", "hidden"));
    });
    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#4E79A7")
      .text(groupData);
  }
  

  //===================================================================================================
  function VeChart_11_12(dataset, chartType) {
    const margin = { top: 20, right: 40, bottom: chartType === "Q12" ? 80 : 40, left: 50 };
    const width = 1200;
    const height = 600;

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataset.map((d) => d.item))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataset, (d) => d.customers) * 1.15])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(new Set(dataset.map(d => d.group)))
      .range(tableauClassic10);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat((d) => d))
      .attr("class", "axis-label");

    const xAxis = svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10));

    if (chartType === "Q12") {
      xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-90) translate(-2,-12)")
        .text(d => `${(d+50000) / 1000}K`);
    }

    svg.selectAll("line.horizontal-grid")
      .data(y.ticks())
      .enter()
      .append("line")
      .attr("class", "horizontal-grid")
      .attr("x1", 0)
      .attr("y1", (d) => y(d))
      .attr("x2", width)
      .attr("y2", (d) => y(d))
      .style("stroke", "gray")
      .style("opacity", 0.2);

    const tooltip = d3.select("#chart")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("border-radius", "8px")
      .style("padding", "8px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
      .style("opacity", 0);

    svg.selectAll(".bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.item) - (x.bandwidth() * 0.14))
      .attr("y", (d) => y(d.customers))
      .attr("width", x.bandwidth() * 1.16)
      .attr("height", (d) => height - y(d.customers))
      .attr("fill", (d) => colorScale(d.group))
      .on("mouseover", (event, d) => {
        const tooltipContent = chartType === "Q11"
          ? `Đã mua ${d.item} lần<br>Số lượng KH: ${d.customers.toLocaleString()}`
          : `Đã chi tiêu từ ${d.item.toLocaleString()}K đến ${(d.item + 50000).toLocaleString()}K<br>
             Số lượng KH: ${d.customers.toLocaleString()}`;
      
        tooltip.style("opacity", 1).html(tooltipContent);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  }

  selector.on("change", function () {
    const value = d3.select(this).property("value");
    if (value === "chart1") drawChart1();
    else if (value === "chart2") drawChart2();
    else if (value === "chart3") drawChart3();
    else if (value === "chart4") drawChart4();
    else if (value === "chart5") drawChart5();
    else if (value === "chart6") drawChart6();
    else if (value === "chart7") drawChart7();
    else if (value === "chart8") drawChart8();
    else if (value === "chart9") drawChart9();
    else if (value === "chart10") drawChart10();
    else if (value === "chart11") drawChart11();
    else if (value === "chart12") drawChart12();
  });

  drawChart1();
});