import { api } from './api.js';

// DOM Elements & View State
let currentView = 'dashboard';
let clientesCache = [];
let cotizacionesCache = [];
let llamadasCache = [];

// Toast Manager
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Close modals when clicking close button or background
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-modal]') || e.target.classList.contains('modal-overlay')) {
    const openModals = document.querySelectorAll('.modal-overlay.active');
    openModals.forEach(m => {
      // Don't close login modal if no user logged in
      if (m.id === 'modal-login' && !api.getCurrentUser()) return;
      m.classList.remove('active');
    });
  }
});

// View Navigation
window.navigateTo = function(viewName) {
  currentView = viewName;
  document.querySelectorAll('.crm-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.sidebar-menu .nav-item').forEach(i => i.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewName}`);
  const targetNav = document.querySelector(`.sidebar-menu .nav-item[data-view="${viewName}"]`);

  if (targetView) targetView.style.display = 'block';
  if (targetNav) targetNav.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard General',
    'clientes': 'Maestro de Clientes (SOAP / CXF)',
    'cotizaciones': 'Gestión de Cotizaciones (OpenFeign)',
    'llamadas': 'Bitácora de Llamadas & Actividades',
    'soap-console': 'Consola de Servicios Web SOAP & WSDL'
  };
  document.getElementById('current-view-title').innerText = titles[viewName] || 'Dashboard';

  // Refresh data on view change
  refreshCurrentView();
};

document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.getAttribute('data-view');
    if (view) window.navigateTo(view);
  });
});

// User Session and Auth UI
function updateAuthUI() {
  const user = api.getCurrentUser();
  if (!user) {
    openModal('modal-login');
  } else {
    closeModal('modal-login');
    document.getElementById('sidebar-user-name').innerText = user.nombres || user.correo;
    document.getElementById('sidebar-user-role').innerText = user.rol || 'USUARIO';
    const initials = (user.nombres || user.correo).substring(0, 2).toUpperCase();
    document.getElementById('sidebar-user-avatar').innerText = initials;
  }
}

// Login Form Submit
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = document.getElementById('login-email').value;
  const clave = document.getElementById('login-clave').value;

  try {
    const res = await api.auth.login(correo, clave);
    showToast(`¡Bienvenido al sistema, ${res.user.nombres}!`, 'success');
    updateAuthUI();
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Quick Login Demo Buttons
document.getElementById('quick-login-admin').addEventListener('click', () => {
  document.getElementById('login-email').value = 'admin@cibertec.edu.pe';
  document.getElementById('login-clave').value = 'admin123';
});
document.getElementById('quick-login-comercial').addEventListener('click', () => {
  document.getElementById('login-email').value = 'comercial@cibertec.edu.pe';
  document.getElementById('login-clave').value = 'comercial123';
});
document.getElementById('quick-login-dataentry').addEventListener('click', () => {
  document.getElementById('login-email').value = 'dataentry@cibertec.edu.pe';
  document.getElementById('login-clave').value = 'dataentry123';
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  api.clearSession();
  showToast('Sesión cerrada correctamente.', 'warning');
  updateAuthUI();
});

// Connection Status Monitor
async function checkBackendStatus() {
  const isLive = await api.checkConnection();
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  if (api.mode === 'live') {
    dot.className = isLive ? 'status-dot connected' : 'status-dot mock';
    text.innerText = isLive ? 'Gateway :8080 Conectado' : 'Gateway Desconectado';
  } else if (api.mode === 'mock') {
    dot.className = 'status-dot mock';
    text.innerText = 'Modo Demo Activo';
  } else {
    // Auto
    if (isLive) {
      dot.className = 'status-dot connected';
      text.innerText = 'Gateway Conectado';
    } else {
      dot.className = 'status-dot mock';
      text.innerText = 'Modo Demo Local';
    }
  }
}

document.getElementById('pill-gateway-status').addEventListener('click', () => {
  openModal('modal-config');
});

document.getElementById('btn-test-connection').addEventListener('click', async () => {
  showToast('Verificando conexión con http://localhost:8080...', 'warning');
  const isLive = await api.checkConnection();
  if (isLive) {
    showToast('¡Éxito! API Gateway en el puerto 8080 está en línea y respondiendo.', 'success');
  } else {
    showToast('API Gateway no responde aún. Se continuará en Modo Demo.', 'warning');
  }
  checkBackendStatus();
});

document.getElementById('select-conn-mode').addEventListener('change', (e) => {
  api.mode = e.target.value;
  localStorage.setItem('crm_mode', api.mode);
  showToast(`Modo cambiado a: ${e.target.value}`, 'success');
  checkBackendStatus();
  loadAllData();
});

document.getElementById('btn-reset-demo').addEventListener('click', () => {
  api.resetDemoData();
  showToast('Datos de demostración reiniciados a los valores por defecto.', 'success');
  loadAllData();
  closeModal('modal-config');
});

// --- DATA LOADERS ---
async function loadAllData() {
  try {
    clientesCache = await api.clientes.listar();
    cotizacionesCache = await api.cotizaciones.listar();
    llamadasCache = await api.llamadas.listar();

    // Update sidebar badges
    document.getElementById('badge-clientes').innerText = clientesCache.filter(c => c.estado).length;
    document.getElementById('badge-cotizaciones').innerText = cotizacionesCache.length;
    document.getElementById('badge-llamadas').innerText = llamadasCache.length;

    refreshCurrentView();
  } catch (err) {
    console.error('Error loading data', err);
    showToast('Error cargando datos: ' + err.message, 'error');
  }
}

function refreshCurrentView() {
  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'clientes') renderClientes(clientesCache);
  if (currentView === 'cotizaciones') renderCotizaciones(cotizacionesCache);
  if (currentView === 'llamadas') renderLlamadas(llamadasCache);
}

// --- DASHBOARD RENDER ---
function renderDashboard() {
  const totalClientes = clientesCache.filter(c => c.estado).length;
  const totalCotizaciones = cotizacionesCache.length;
  const montoTotal = cotizacionesCache.reduce((acc, c) => acc + (parseFloat(c.montoEstimado) || 0), 0);
  const totalLlamadas = llamadasCache.length;

  document.getElementById('stat-total-clientes').innerText = totalClientes;
  document.getElementById('stat-total-cotizaciones').innerText = totalCotizaciones;
  document.getElementById('stat-monto-cotizaciones').innerText = `S/ ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  document.getElementById('stat-total-llamadas').innerText = totalLlamadas;

  // Recent Cotizaciones
  const cotizTbody = document.getElementById('dashboard-cotizaciones-tbody');
  const recentCotiz = [...cotizacionesCache].slice(0, 5);
  cotizTbody.innerHTML = recentCotiz.map(c => {
    const client = clientesCache.find(cl => cl.id === c.idCliente);
    const clientName = client ? client.rzoSocial : `Cliente #${c.idCliente}`;
    return `
      <tr>
        <td>#${c.id}</td>
        <td>${c.fecha || '-'}</td>
        <td><strong>${clientName}</strong></td>
        <td>${c.descripcion || '-'}</td>
        <td style="font-weight: 600; color: #34D399;">S/ ${(c.montoEstimado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
        <td><span class="badge ${getCotizBadge(c.estado)}">${c.estado}</span></td>
      </tr>
    `;
  }).join('');

  // Recent Llamadas
  const llamadasTbody = document.getElementById('dashboard-llamadas-tbody');
  const recentLlamadas = [...llamadasCache].slice(0, 5);
  llamadasTbody.innerHTML = recentLlamadas.map(l => {
    const client = clientesCache.find(cl => cl.id === l.idCliente);
    const clientName = client ? client.rzoSocial : `Cliente #${l.idCliente}`;
    return `
      <tr>
        <td><span class="badge ${l.tipoLlamada === 'SALIENTE' ? 'badge-purple' : 'badge-info'}">${l.tipoLlamada}</span></td>
        <td><strong>${clientName}</strong></td>
        <td>${l.fechaInicio ? l.fechaInicio.replace('T', ' ') : '-'}</td>
        <td>${l.numeroTelefono || '-'}</td>
        <td><span class="badge ${getResultadoBadge(l.resultado)}">${l.resultado}</span></td>
        <td><span class="badge ${l.estado === 'FINALIZADA' ? 'badge-success' : 'badge-warning'}">${l.estado}</span></td>
      </tr>
    `;
  }).join('');
}

// Badge Helpers
function getCotizBadge(estado) {
  if (estado === 'APROBADA') return 'badge-success';
  if (estado === 'ENVIADA') return 'badge-info';
  if (estado === 'BORRADOR') return 'badge-warning';
  return 'badge-danger';
}

function getResultadoBadge(res) {
  if (res === 'VENTA_CERRADA') return 'badge-success';
  if (res === 'INTERESADO') return 'badge-info';
  if (res === 'ATENDIDA') return 'badge-purple';
  if (res === 'OCUPADO' || res === 'NO_CONTESTADA' || res === 'RECHAZADA') return 'badge-danger';
  return 'badge-warning';
}

// --- CLIENTES RENDER ---
function renderClientes(list) {
  const tbody = document.getElementById('clientes-tbody');
  tbody.innerHTML = list.map(c => `
    <tr>
      <td>#${c.id}</td>
      <td><code style="color: #38BDF8;">${c.ruc}</code></td>
      <td><strong>${c.rzoSocial}</strong></td>
      <td><span class="badge badge-info">${c.tipoCliente || 'REGULAR'}</span></td>
      <td>${c.email}</td>
      <td>${c.telefono}</td>
      <td>
        <span class="badge ${c.estado ? 'badge-success' : 'badge-danger'}">
          ${c.estado ? 'Activo' : 'Inactivo (Soft-Delete)'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="window.editCliente(${c.id})">Editar</button>
          ${c.estado ? `
            <button class="btn btn-danger btn-sm" onclick="window.deleteCliente(${c.id})">Inactivar</button>
          ` : `
            <button class="btn btn-success btn-sm" onclick="window.restoreCliente(${c.id})">Reactivar</button>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}

// Filter Clientes
document.getElementById('search-clientes').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = clientesCache.filter(c => 
    c.rzoSocial.toLowerCase().includes(q) || 
    c.ruc.includes(q) || 
    c.email.toLowerCase().includes(q)
  );
  renderClientes(filtered);
});

// New Cliente Button & Form
document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
  document.getElementById('modal-cliente-title').innerText = 'Nuevo Cliente (SOAP JAX-WS)';
  document.getElementById('form-cliente').reset();
  document.getElementById('cliente-id').value = '';
  openModal('modal-cliente');
});

document.getElementById('btn-quick-cliente').addEventListener('click', () => {
  window.navigateTo('clientes');
  document.getElementById('btn-nuevo-cliente').click();
});

window.editCliente = function(id) {
  const c = clientesCache.find(item => item.id === id);
  if (!c) return;
  document.getElementById('modal-cliente-title').innerText = `Editar Cliente #${c.id}`;
  document.getElementById('cliente-id').value = c.id;
  document.getElementById('cliente-ruc').value = c.ruc;
  document.getElementById('cliente-tipo').value = c.tipoCliente || 'CORPORATIVO_B2B';
  document.getElementById('cliente-razon').value = c.rzoSocial;
  document.getElementById('cliente-email').value = c.email;
  document.getElementById('cliente-telefono').value = c.telefono;
  openModal('modal-cliente');
};

document.getElementById('form-cliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cliente-id').value;
  const clienteData = {
    ruc: document.getElementById('cliente-ruc').value,
    tipoCliente: document.getElementById('cliente-tipo').value,
    rzoSocial: document.getElementById('cliente-razon').value,
    email: document.getElementById('cliente-email').value,
    telefono: document.getElementById('cliente-telefono').value
  };

  try {
    if (id) {
      await api.clientes.actualizar(id, clienteData);
      showToast('Cliente actualizado correctamente.', 'success');
    } else {
      await api.clientes.crear(clienteData);
      showToast('Cliente registrado con éxito en clientes-api.', 'success');
    }
    closeModal('modal-cliente');
    loadAllData();
  } catch (err) {
    showToast('Error al guardar cliente: ' + err.message, 'error');
  }
});

window.deleteCliente = async function(id) {
  if (confirm('¿Desea aplicar borrado lógico (soft-delete) al cliente seleccionado?')) {
    try {
      await api.clientes.eliminar(id);
      showToast('Cliente inactivado (soft-delete preservado).', 'warning');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.restoreCliente = async function(id) {
  try {
    await api.clientes.restaurar(id);
    showToast('Cliente reactivado exitosamente.', 'success');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// --- COTIZACIONES RENDER ---
function renderCotizaciones(list) {
  const tbody = document.getElementById('cotizaciones-tbody');
  tbody.innerHTML = list.map(c => {
    const client = clientesCache.find(cl => cl.id === c.idCliente);
    const clientName = client ? client.rzoSocial : `Cliente #${c.idCliente}`;
    return `
      <tr>
        <td>#${c.id}</td>
        <td>${c.fecha}</td>
        <td><strong>${clientName}</strong></td>
        <td>${c.descripcion}</td>
        <td style="font-weight: 700; color: #34D399;">S/ ${(c.montoEstimado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
        <td><span class="badge ${getCotizBadge(c.estado)}">${c.estado}</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="window.deleteCotizacion(${c.id})">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

document.getElementById('search-cotizaciones').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = cotizacionesCache.filter(c => 
    c.descripcion.toLowerCase().includes(q) || 
    (c.observaciones && c.observaciones.toLowerCase().includes(q))
  );
  renderCotizaciones(filtered);
});

// New Cotizacion Modal
function populateCotizacionClients() {
  const select = document.getElementById('cotizacion-cliente');
  const activeClients = clientesCache.filter(c => c.estado);
  select.innerHTML = activeClients.map(c => `
    <option value="${c.id}">${c.rzoSocial} (RUC: ${c.ruc})</option>
  `).join('');

  if (activeClients.length === 0) {
    select.innerHTML = '<option value="">No hay clientes activos disponibles</option>';
  }
}

document.getElementById('btn-nueva-cotizacion').addEventListener('click', () => {
  populateCotizacionClients();
  document.getElementById('form-cotizacion').reset();
  document.getElementById('cotizacion-id').value = '';
  document.getElementById('cotizacion-fecha').value = new Date().toISOString().split('T')[0];
  openModal('modal-cotizacion');
});

document.getElementById('btn-quick-cotizacion').addEventListener('click', () => {
  window.navigateTo('cotizaciones');
  document.getElementById('btn-nueva-cotizacion').click();
});

document.getElementById('form-cotizacion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idCliente = document.getElementById('cotizacion-cliente').value;
  if (!idCliente) {
    showToast('Seleccione un cliente válido para cotizar.', 'error');
    return;
  }

  const cotizData = {
    idCliente: Number(idCliente),
    fecha: document.getElementById('cotizacion-fecha').value,
    montoEstimado: parseFloat(document.getElementById('cotizacion-monto').value),
    descripcion: document.getElementById('cotizacion-descripcion').value,
    estado: document.getElementById('cotizacion-estado').value,
    observaciones: document.getElementById('cotizacion-obs').value
  };

  try {
    await api.cotizaciones.crear(cotizData);
    showToast('Cotización registrada exitosamente con validación OpenFeign.', 'success');
    closeModal('modal-cotizacion');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

window.deleteCotizacion = async function(id) {
  if (confirm('¿Eliminar cotización seleccionada?')) {
    try {
      await api.cotizaciones.eliminar(id);
      showToast('Cotización eliminada.', 'warning');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

// --- LLAMADAS RENDER ---
function renderLlamadas(list) {
  const tbody = document.getElementById('llamadas-tbody');
  tbody.innerHTML = list.map(l => {
    const client = clientesCache.find(cl => cl.id === l.idCliente);
    const clientName = client ? client.rzoSocial : `Cliente #${l.idCliente}`;
    return `
      <tr>
        <td>#${l.id}</td>
        <td><span class="badge ${l.tipoLlamada === 'SALIENTE' ? 'badge-purple' : 'badge-info'}">${l.tipoLlamada}</span></td>
        <td><strong>${clientName}</strong></td>
        <td><code>${l.numeroTelefono}</code></td>
        <td>${l.fechaInicio ? l.fechaInicio.replace('T', ' ') : '-'}</td>
        <td><span class="badge ${l.estado === 'FINALIZADA' ? 'badge-success' : 'badge-warning'}">${l.estado}</span></td>
        <td><span class="badge ${getResultadoBadge(l.resultado)}">${l.resultado}</span></td>
        <td style="max-width: 250px; font-size: 12px; color: var(--text-muted);">${l.observaciones || '-'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="window.deleteLlamada(${l.id})">Borrar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateLlamadaClients() {
  const select = document.getElementById('llamada-cliente');
  select.innerHTML = clientesCache.filter(c => c.estado).map(c => `
    <option value="${c.id}" data-phone="${c.telefono}">${c.rzoSocial} - ${c.telefono}</option>
  `).join('');

  // Update phone automatically when client selection changes
  select.onchange = () => {
    const opt = select.selectedOptions[0];
    if (opt && opt.dataset.phone) {
      document.getElementById('llamada-telefono').value = opt.dataset.phone;
    }
  };
  if (select.selectedOptions[0]) {
    document.getElementById('llamada-telefono').value = select.selectedOptions[0].dataset.phone || '';
  }
}

document.getElementById('btn-nueva-llamada').addEventListener('click', () => {
  populateLlamadaClients();
  document.getElementById('form-llamada').reset();
  openModal('modal-llamada');
});

document.getElementById('btn-quick-llamada').addEventListener('click', () => {
  window.navigateTo('llamadas');
  document.getElementById('btn-nueva-llamada').click();
});

document.getElementById('form-llamada').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idCliente = document.getElementById('llamada-cliente').value;
  const llamadaData = {
    idCliente: Number(idCliente),
    tipoLlamada: document.getElementById('llamada-tipo').value,
    numeroTelefono: document.getElementById('llamada-telefono').value,
    estado: document.getElementById('llamada-estado').value,
    resultado: document.getElementById('llamada-resultado').value,
    observaciones: document.getElementById('llamada-obs').value,
    fechaInicio: new Date().toISOString().slice(0, 19)
  };

  try {
    await api.llamadas.crear(llamadaData);
    showToast('Llamada comercial registrada exitosamente en llamada-api.', 'success');
    closeModal('modal-llamada');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

window.deleteLlamada = async function(id) {
  if (confirm('¿Eliminar registro de llamada?')) {
    try {
      await api.llamadas.eliminar(id);
      showToast('Registro de llamada eliminado.', 'warning');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

// --- SOAP CONSOLE RUNNER ---
const SOAP_TEMPLATES = {
  crear: `<cli:crearCliente>
    <cliente>
        <rzoSocial>MINERA LAS BAMBAS S.A.</rzoSocial>
        <ruc>20552487311</ruc>
        <tipoCliente>CORPORATIVO_B2B</tipoCliente>
        <email>compras@lasbambas.pe</email>
        <telefono>016307000</telefono>
        <estado>true</estado>
    </cliente>
</cli:crearCliente>`,

  listar: `<cli:listarClientesActivos/>`
};

document.getElementById('btn-load-soap-crear').addEventListener('click', () => {
  document.getElementById('soap-xml-request').value = SOAP_TEMPLATES.crear;
});

document.getElementById('btn-load-soap-listar').addEventListener('click', () => {
  document.getElementById('soap-xml-request').value = SOAP_TEMPLATES.listar;
});

document.getElementById('btn-send-soap').addEventListener('click', async () => {
  const xmlBody = document.getElementById('soap-xml-request').value.trim();
  if (!xmlBody) {
    showToast('Ingrese el cuerpo XML para enviar la petición SOAP.', 'error');
    return;
  }

  showToast('Enviando Envelope SOAP a través del API Gateway (:8080)...', 'warning');
  try {
    const res = await api.clientes.invocarSoap('crearCliente', xmlBody);
    document.getElementById('soap-xml-response').value = res.xml;
    showToast(`Respuesta SOAP recibida (Status: ${res.status}).`, 'success');
  } catch (err) {
    // If Gateway is offline, generate beautiful simulated CXF SOAP response
    const mockSoapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:crearClienteResponse xmlns:ns2="http://clientesapi.example.com/">
            <cliente>
                <id>7</id>
                <rzoSocial>MINERA LAS BAMBAS S.A.</rzoSocial>
                <ruc>20552487311</ruc>
                <tipoCliente>CORPORATIVO_B2B</tipoCliente>
                <email>compras@lasbambas.pe</email>
                <telefono>016307000</telefono>
                <estado>true</estado>
            </cliente>
        </ns2:crearClienteResponse>
    </soap:Body>
</soap:Envelope>`;
    document.getElementById('soap-xml-response').value = mockSoapResponse;
    showToast('Respuesta SOAP simulada (Apache CXF Mock activo).', 'warning');
  }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Preload default SOAP template
  document.getElementById('soap-xml-request').value = SOAP_TEMPLATES.crear;

  // Check auth & connection
  updateAuthUI();
  checkBackendStatus();
  loadAllData();
});
