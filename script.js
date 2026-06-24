const pedidosIniciais = [
  { cliente: "Ana Souza", produto: "Notebook Lenovo", quantidade: 1, data: "2026-01-24", status: "Pago", valor: 3200 },
  { cliente: "Lucas Lima", produto: "Mouse Gamer", quantidade: 2, data: "2026-02-23", status: "Pendente", valor: 180 },
  { cliente: "Marina Costa", produto: "Teclado Mecânico", quantidade: 1, data: "2026-03-22", status: "Pago", valor: 340 },
  { cliente: "Pedro Alves", produto: "Headset Bluetooth", quantidade: 1, data: "2026-04-21", status: "Cancelado", valor: 130 },
  { cliente: "Bianca Rocha", produto: "Monitor LG", quantidade: 1, data: "2026-05-20", status: "Pago", valor: 1150 },
  { cliente: "Carlos Mendes", produto: "Mouse Gamer", quantidade: 3, data: "2026-06-19", status: "Pago", valor: 270 },
  { cliente: "Fernanda Dias", produto: "Teclado Mecânico", quantidade: 2, data: "2026-06-18", status: "Pago", valor: 680 }
];

let pedidos = JSON.parse(localStorage.getItem("pedidos")) || pedidosIniciais;
let pedidoEditandoIndex = null;

const ordersTable = document.querySelector("#ordersTable");
const searchInput = document.querySelector("#searchInput");
const monthFilter = document.querySelector("#monthFilter");
const statusFilter = document.querySelector("#statusFilter");
const ordersCount = document.querySelector("#ordersCount");
const productList = document.querySelector("#productList");
const salesChart = document.querySelector("#salesChart");

const revenue = document.querySelector("#revenue");
const totalOrders = document.querySelector("#totalOrders");
const averageTicket = document.querySelector("#averageTicket");
const conversion = document.querySelector("#conversion");

const openModalButton = document.querySelector("#openModalButton");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelModalButton = document.querySelector("#cancelModalButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const clearDataButton = document.querySelector("#clearDataButton");
const restoreDataButton = document.querySelector("#restoreDataButton");

const mobileMenuButton = document.querySelector("#mobileMenuButton");
const closeMobileMenuButton = document.querySelector("#closeMobileMenuButton");
const mobileMenuBackdrop = document.querySelector("#mobileMenuBackdrop");
const headerActions = document.querySelector("#headerActions");

const saleModal = document.querySelector("#saleModal");
const saleForm = document.querySelector("#saleForm");
const modalTitle = document.querySelector("#modalTitle");
const saveSaleButton = document.querySelector("#saveSaleButton");

const customerInput = document.querySelector("#customerInput");
const productInput = document.querySelector("#productInput");
const quantityInput = document.querySelector("#quantityInput");
const dateInput = document.querySelector("#dateInput");
const saleStatusInput = document.querySelector("#saleStatusInput");
const valueInput = document.querySelector("#valueInput");

function formatarDinheiro(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function pegarMes(data) {
  return data.split("-")[1];
}

function pegarClasseStatus(status) {
  if (status === "Pago") return "paid";
  if (status === "Pendente") return "pending";
  return "canceled";
}

function salvarPedidos() {
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

function obterPedidosFiltrados() {
  const textoBusca = searchInput.value.toLowerCase();
  const mesSelecionado = monthFilter.value;
  const statusSelecionado = statusFilter.value;

  return pedidos
    .map(function (pedido, index) {
      return { ...pedido, indexOriginal: index };
    })
    .filter(function (pedido) {
      const buscaCombina =
        pedido.cliente.toLowerCase().includes(textoBusca) ||
        pedido.produto.toLowerCase().includes(textoBusca);

      const mesCombina =
        mesSelecionado === "todos" || pegarMes(pedido.data) === mesSelecionado;

      const statusCombina =
        statusSelecionado === "todos" || pedido.status === statusSelecionado;

      return buscaCombina && mesCombina && statusCombina;
    });
}

function atualizarMetricas() {
  const pedidosFiltrados = obterPedidosFiltrados();

  const pedidosPagos = pedidosFiltrados.filter(function (pedido) {
    return pedido.status === "Pago";
  });

  const faturamento = pedidosPagos.reduce(function (total, pedido) {
    return total + pedido.valor;
  }, 0);

  const ticketMedio = pedidosPagos.length > 0 ? faturamento / pedidosPagos.length : 0;
  const taxaConversao = pedidosFiltrados.length > 0
    ? (pedidosPagos.length / pedidosFiltrados.length) * 100
    : 0;

  revenue.textContent = formatarDinheiro(faturamento);
  totalOrders.textContent = pedidosFiltrados.length;
  averageTicket.textContent = formatarDinheiro(ticketMedio);
  conversion.textContent = `${taxaConversao.toFixed(1)}%`;
}

function renderizarProdutos() {
  const pedidosFiltrados = obterPedidosFiltrados();
  const produtos = {};

  pedidosFiltrados.forEach(function (pedido) {
    if (pedido.status !== "Pago") return;

    if (!produtos[pedido.produto]) {
      produtos[pedido.produto] = {
        nome: pedido.produto,
        quantidade: 0,
        total: 0
      };
    }

    produtos[pedido.produto].quantidade += pedido.quantidade;
    produtos[pedido.produto].total += pedido.valor;
  });

  const ranking = Object.values(produtos).sort(function (a, b) {
    return b.quantidade - a.quantidade;
  });

  if (ranking.length === 0) {
    productList.innerHTML = `<p class="empty-message">Nenhum produto encontrado.</p>`;
    return;
  }

  productList.innerHTML = ranking.map(function (produto) {
    return `
      <div class="product-item">
        <div>
          <strong>${produto.nome}</strong>
          <span>${produto.quantidade} vendas</span>
        </div>
        <p>${formatarDinheiro(produto.total)}</p>
      </div>
    `;
  }).join("");
}

function renderizarGrafico() {
  const pedidosFiltrados = obterPedidosFiltrados();

  const meses = [
    { numero: "01", nome: "Jan", total: 0 },
    { numero: "02", nome: "Fev", total: 0 },
    { numero: "03", nome: "Mar", total: 0 },
    { numero: "04", nome: "Abr", total: 0 },
    { numero: "05", nome: "Mai", total: 0 },
    { numero: "06", nome: "Jun", total: 0 }
  ];

  pedidosFiltrados.forEach(function (pedido) {
    if (pedido.status !== "Pago") return;

    const mesDoPedido = pegarMes(pedido.data);

    const mesEncontrado = meses.find(function (mes) {
      return mes.numero === mesDoPedido;
    });

    if (mesEncontrado) {
      mesEncontrado.total += pedido.valor;
    }
  });

  const maiorValor = Math.max(...meses.map(function (mes) {
    return mes.total;
  }));

  salesChart.innerHTML = meses.map(function (mes) {
    const altura = maiorValor > 0 ? (mes.total / maiorValor) * 100 : 0;

    return `
      <div class="bar-wrapper" title="${mes.nome}: ${formatarDinheiro(mes.total)}">
        <strong class="bar-value">${formatarDinheiro(mes.total)}</strong>
        <div class="bar" style="height: ${altura}%;"></div>
        <span>${mes.nome}</span>
      </div>
    `;
  }).join("");
}

function renderizarPedidos() {
  const pedidosFiltrados = obterPedidosFiltrados();

  ordersCount.textContent = `${pedidosFiltrados.length} pedidos`;

  if (pedidosFiltrados.length === 0) {
    ordersTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-message">Nenhum pedido encontrado.</td>
      </tr>
    `;
    return;
  }

  ordersTable.innerHTML = pedidosFiltrados.map(function (pedido) {
    return `
      <tr>
        <td>${pedido.cliente}</td>
        <td>${pedido.produto}</td>
        <td>${formatarData(pedido.data)}</td>
        <td>
          <span class="status ${pegarClasseStatus(pedido.status)}">
            ${pedido.status}
          </span>
        </td>
        <td>${formatarDinheiro(pedido.valor)}</td>
        <td>
          <div class="action-buttons">
            <button class="table-button" onclick="editarPedido(${pedido.indexOriginal})">
              Editar
            </button>
            <button class="table-button delete" onclick="excluirPedido(${pedido.indexOriginal})">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function exportarCsv() {
  const pedidosFiltrados = obterPedidosFiltrados();

  if (pedidosFiltrados.length === 0) {
    alert("Não há pedidos para exportar.");
    return;
  }

  const cabecalho = ["Cliente", "Produto", "Quantidade", "Data", "Status", "Valor"];

  const linhas = pedidosFiltrados.map(function (pedido) {
    return [
      pedido.cliente,
      pedido.produto,
      pedido.quantidade,
      formatarData(pedido.data),
      pedido.status,
      pedido.valor.toFixed(2).replace(".", ",")
    ];
  });

  const conteudoCsv = [cabecalho, ...linhas]
    .map(function (linha) {
      return linha.map(function (campo) {
        return `"${String(campo).replaceAll('"', '""')}"`;
      }).join(";");
    })
    .join("\n");

  const arquivo = new Blob(["\uFEFF" + conteudoCsv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "pedidos-vendas-pulse.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function atualizarDashboard() {
  atualizarMetricas();
  renderizarProdutos();
  renderizarGrafico();
  renderizarPedidos();
}

function abrirMenuMobile() {
  headerActions.classList.add("open");
  mobileMenuBackdrop.classList.add("open");
  document.body.classList.add("menu-open");
}

function fecharMenuMobile() {
  headerActions.classList.remove("open");
  mobileMenuBackdrop.classList.remove("open");
  document.body.classList.remove("menu-open");
}

function abrirModal() {
  fecharMenuMobile();
  saleModal.classList.add("open");
}

function fecharModal() {
  saleModal.classList.remove("open");
  saleForm.reset();
  pedidoEditandoIndex = null;
  modalTitle.textContent = "Cadastrar venda";
  saveSaleButton.textContent = "Salvar venda";
}

function editarPedido(index) {
  const pedido = pedidos[index];

  pedidoEditandoIndex = index;

  customerInput.value = pedido.cliente;
  productInput.value = pedido.produto;
  quantityInput.value = pedido.quantidade;
  dateInput.value = pedido.data;
  saleStatusInput.value = pedido.status;
  valueInput.value = pedido.valor;

  modalTitle.textContent = "Editar venda";
  saveSaleButton.textContent = "Atualizar venda";

  abrirModal();
}

function excluirPedido(index) {
  const confirmar = confirm("Tem certeza que deseja excluir este pedido?");

  if (!confirmar) return;

  pedidos.splice(index, 1);
  salvarPedidos();
  atualizarDashboard();
}

function limparDados() {
  const confirmar = confirm("Tem certeza que deseja apagar todos os pedidos?");

  if (!confirmar) return;

  pedidos = [];
  salvarPedidos();
  fecharMenuMobile();
  atualizarDashboard();
}

function restaurarDadosIniciais() {
  const confirmar = confirm("Deseja restaurar os dados de exemplo?");

  if (!confirmar) return;

  pedidos = [...pedidosIniciais];
  salvarPedidos();
  fecharMenuMobile();
  atualizarDashboard();
}

saleForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const pedidoAtualizado = {
    cliente: customerInput.value,
    produto: productInput.value,
    quantidade: Number(quantityInput.value),
    data: dateInput.value,
    status: saleStatusInput.value,
    valor: Number(valueInput.value)
  };

  if (pedidoEditandoIndex === null) {
    pedidos.push(pedidoAtualizado);
  } else {
    pedidos[pedidoEditandoIndex] = pedidoAtualizado;
  }

  salvarPedidos();
  fecharModal();
  atualizarDashboard();
});

mobileMenuButton.addEventListener("click", abrirMenuMobile);
closeMobileMenuButton.addEventListener("click", fecharMenuMobile);
mobileMenuBackdrop.addEventListener("click", fecharMenuMobile);

document.querySelectorAll(".mobile-action-link").forEach(function (link) {
  link.addEventListener("click", fecharMenuMobile);
});

openModalButton.addEventListener("click", abrirModal);
closeModalButton.addEventListener("click", fecharModal);
cancelModalButton.addEventListener("click", fecharModal);
exportCsvButton.addEventListener("click", exportarCsv);
clearDataButton.addEventListener("click", limparDados);
restoreDataButton.addEventListener("click", restaurarDadosIniciais);

searchInput.addEventListener("input", atualizarDashboard);
monthFilter.addEventListener("change", atualizarDashboard);
statusFilter.addEventListener("change", atualizarDashboard);

atualizarDashboard();