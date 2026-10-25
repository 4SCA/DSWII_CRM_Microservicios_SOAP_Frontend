// CRM Microservicios DSW II - Unified API Layer (Live + Demo Mode)

const GATEWAY_URL = 'http://localhost:8080';

// Initial Mock Data Store (Peruvian Enterprise CRM Dataset)
const INITIAL_USERS = [
  { id: 1, nombres: 'Carlos', apellidos: 'Mendoza Vargas', correo: 'admin@cibertec.edu.pe', rol: 'ADMIN', clave: 'admin123' },
  { id: 2, nombres: 'Valeria', apellidos: 'Salazar Ríos', correo: 'comercial@cibertec.edu.pe', rol: 'COMERCIAL', clave: 'comercial123' },
  { id: 3, nombres: 'Jorge', apellidos: 'Paredes Silva', correo: 'dataentry@cibertec.edu.pe', rol: 'DATA_ENTRY', clave: 'dataentry123' }
];

const INITIAL_CLIENTES = [
  { id: 1, rzoSocial: 'ALICORP S.A.A.', ruc: '20100055237', tipoCliente: 'CORPORATIVO_B2B', email: 'compras@alicorp.com.pe', telefono: '013155600', estado: true },
  { id: 2, rzoSocial: 'FERREYROS S.A.', ruc: '20100028698', tipoCliente: 'CORPORATIVO_B2B', email: 'ventas@ferreyros.com.pe', telefono: '016264000', estado: true },
  { id: 3, rzoSocial: 'GLORIA S.A.', ruc: '20100190797', tipoCliente: 'VIP', email: 'contacto@gloria.com.pe', telefono: '014707170', estado: true },
  { id: 4, rzoSocial: 'BANCO INTERBANK S.A.', ruc: '20100053455', tipoCliente: 'CORPORATIVO_B2B', email: 'servicios@interbank.pe', telefono: '013119000', estado: true },
  { id: 5, rzoSocial: 'INRETAIL PERU CORP.', ruc: '20546738912', tipoCliente: 'VIP', email: 'licitaciones@inretail.pe', telefono: '016188000', estado: false },
  { id: 6, rzoSocial: 'DISTRIBUIDORA LIMA NORTE S.A.C.', ruc: '20601234567', tipoCliente: 'REGULAR_B2C', email: 'pedidos@limanorte.com', telefono: '015289944', estado: true }
];

const INITIAL_COTIZACIONES = [
  { id: 1, fecha: '2026-10-20', idCliente: 1, idUsuario: 2, descripcion: 'Implementación de Microservicios Cloud & Middleware SOAP', montoEstimado: 45000.00, estado: 'APROBADA', observaciones: 'Contrato firmado por 12 meses. Facturación mensual.' },
  { id: 2, fecha: '2026-10-21', idCliente: 2, idUsuario: 2, descripcion: 'Licenciamiento Empresarial y Consultoría SOA Apache CXF', montoEstimado: 28500.00, estado: 'ENVIADA', observaciones: 'Pendiente de aprobación de gerencia técnica.' },
  { id: 3, fecha: '2026-10-22', idCliente: 3, idUsuario: 2, descripcion: 'Auditoría de Seguridad Perimetral y Tokens JWT', montoEstimado: 17200.00, estado: 'BORRADOR', observaciones: 'Cotización en revisión interna preliminar.' },
  { id: 4, fecha: '2026-10-22', idCliente: 4, idUsuario: 1, descripcion: 'Infraestructura de Mensajería Kafka y Tolerancia a Fallas', montoEstimado: 62000.00, estado: 'ENVIADA', observaciones: 'Propuesta técnica presentada al comité de TI.' }
];

const INITIAL_LLAMADAS = [
  { id: 1, tipoLlamada: 'SALIENTE', observaciones: 'Presentación de propuesta técnica de arquitectura y cotización #1. Cliente muy interesado en tiempos de respuesta.', fechaInicio: '2026-10-21T10:30:00', fechaFin: '2026-10-21T10:48:00', idUsuario: 2, idCliente: 1, numeroTelefono: '013155600', estado: 'FINALIZADA', resultado: 'VENTA_CERRADA' },
  { id: 2, tipoLlamada: 'ENTRANTE', observaciones: 'Consulta técnica sobre el soporte de contratos XSD para facturación electrónica.', fechaInicio: '2026-10-21T15:15:00', fechaFin: '2026-10-21T15:28:00', idUsuario: 2, idCliente: 2, numeroTelefono: '016264000', estado: 'FINALIZADA', resultado: 'INTERESADO' },
  { id: 3, tipoLlamada: 'SALIENTE', observaciones: 'Llamada de seguimiento a cotización #3. Línea ocupada, se reprogramará contacto para mañana.', fechaInicio: '2026-10-22T09:00:00', fechaFin: '2026-10-22T09:02:00', idUsuario: 2, idCliente: 3, numeroTelefono: '014707170', estado: 'FINALIZADA', resultado: 'OCUPADO' },
  { id: 4, tipoLlamada: 'SALIENTE', observaciones: 'Coordinación inicial para demo de la arquitectura de microservicios con el equipo de TI.', fechaInicio: '2026-10-22T16:00:00', fechaFin: null, idUsuario: 1, idCliente: 4, numeroTelefono: '013119000', estado: 'PROGRAMADA', resultado: 'REAGENDAR' }
];

// LocalStorage Persistence Helpers
function loadStore(key, defaults) {
  try {
    const raw = localStorage.getItem(`crm_${key}`);
    return raw ? JSON.parse(raw) : defaults;
  } catch (e) {
    return defaults;
  }
}

function saveStore(key, data) {
  try {
    localStorage.setItem(`crm_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving store to localStorage', e);
  }
}

// Global Memory State
let memoryData = {
  users: loadStore('users', INITIAL_USERS),
  clientes: loadStore('clientes', INITIAL_CLIENTES),
  cotizaciones: loadStore('cotizaciones', INITIAL_COTIZACIONES),
  llamadas: loadStore('llamadas', INITIAL_LLAMADAS)
};

export const api = {
  baseUrl: GATEWAY_URL,
  mode: localStorage.getItem('crm_mode') || 'auto', // 'auto', 'live', 'mock'
  liveAvailable: false,

  // Token & User session
  getToken() {
    return localStorage.getItem('crm_token') || null;
  },

  getCurrentUser() {
    const raw = localStorage.getItem('crm_current_user');
    return raw ? JSON.parse(raw) : null;
  },

  setSession(token, user) {
    localStorage.setItem('crm_token', token);
    localStorage.setItem('crm_current_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_current_user');
  },

  // Health check for Gateway
  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${GATEWAY_URL}/actuator/health`, {
        method: 'GET',
        signal: controller.signal
      }).catch(async () => {
        // Fallback probe to /auth/login (OPTIONS or GET)
        return await fetch(`${GATEWAY_URL}/auth/login`, {
          method: 'OPTIONS',
          signal: controller.signal
        });
      });
      clearTimeout(timeoutId);
      this.liveAvailable = res.ok || res.status === 401 || res.status === 405 || res.status === 200;
    } catch (e) {
      this.liveAvailable = false;
    }
    return this.liveAvailable;
  },

  shouldUseLive() {
    if (this.mode === 'live') return true;
    if (this.mode === 'mock') return false;
    return this.liveAvailable;
  },

  // Generic Request Helper
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Error HTTP ${res.status}: ${res.statusText}`);
    }

    if (res.status === 204) return null;
    return await res.json();
  },

  // --- AUTH MODULE ---
  auth: {
    async login(correo, clave) {
      if (api.shouldUseLive()) {
        try {
          const data = await api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ correo, clave })
          });
          // JWT token returned from backend
          const user = {
            id: data.id || 1,
            nombres: data.nombres || correo.split('@')[0],
            correo: correo,
            rol: data.rol || 'COMERCIAL'
          };
          api.setSession(data.token, user);
          return { success: true, user, token: data.token };
        } catch (err) {
          if (api.mode === 'live') throw err;
          console.warn('Live login failed, falling back to mock verify:', err.message);
        }
      }

      // Mock login fallback
      const found = memoryData.users.find(u => u.correo.toLowerCase() === correo.toLowerCase());
      if (!found || found.clave !== clave) {
        throw new Error('Credenciales inválidas. Compruebe el correo y la contraseña.');
      }
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIke2ZvdW5kLmNvcnJlb30iLCJ1c2VySWQiOiR7Zm91bmQuaWR9LCJyb2xlIjoiJHpmb3VuZC5yb2x9Iiwibm9tYnJlIjoiJHpmb3VuZC5ub21icmVzfSIsImV4cCI6OTk5OTk5OTk5OX0.mockSignatureKey`;
      const user = { id: found.id, nombres: `${found.nombres} ${found.apellidos}`, correo: found.correo, rol: found.rol };
      api.setSession(fakeToken, user);
      return { success: true, user, token: fakeToken };
    },

    async register(data) {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
          });
        } catch (err) {
          if (api.mode === 'live') throw err;
        }
      }

      const id = Date.now();
      const newUser = { id, ...data, estado: true };
      memoryData.users.push(newUser);
      saveStore('users', memoryData.users);
      return newUser;
    }
  },

  // --- CLIENTES MODULE ---
  clientes: {
    async listar() {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/clientes');
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      return [...memoryData.clientes];
    },

    async listarActivos() {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/clientes/activos');
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      return memoryData.clientes.filter(c => c.estado === true);
    },

    async obtener(id) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/clientes/${id}`);
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const c = memoryData.clientes.find(item => item.id === Number(id));
      if (!c) throw new Error('Cliente no encontrado');
      return c;
    },

    async crear(clienteData) {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
          });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const newClient = {
        id: memoryData.clientes.length > 0 ? Math.max(...memoryData.clientes.map(c => c.id)) + 1 : 1,
        ...clienteData,
        estado: true
      };
      memoryData.clientes.unshift(newClient);
      saveStore('clientes', memoryData.clientes);
      return newClient;
    },

    async actualizar(id, clienteData) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(clienteData)
          });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const index = memoryData.clientes.findIndex(c => c.id === Number(id));
      if (index === -1) throw new Error('Cliente no encontrado');
      memoryData.clientes[index] = { ...memoryData.clientes[index], ...clienteData };
      saveStore('clientes', memoryData.clientes);
      return memoryData.clientes[index];
    },

    async eliminar(id) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/clientes/${id}`, { method: 'DELETE' });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      // Soft delete
      const client = memoryData.clientes.find(c => c.id === Number(id));
      if (client) {
        client.estado = false;
        saveStore('clientes', memoryData.clientes);
      }
      return { success: true };
    },

    async restaurar(id) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/clientes/${id}/restaurar`, { method: 'PATCH' });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const client = memoryData.clientes.find(c => c.id === Number(id));
      if (client) {
        client.estado = true;
        saveStore('clientes', memoryData.clientes);
      }
      return client;
    },

    // Native SOAP JAX-WS Execution via Apache CXF
    async invocarSoap(operacion, xmlBody) {
      const token = api.getToken();

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:cli="http://clientesapi.example.com/">
  <soapenv:Header/>
  <soapenv:Body>
    ${xmlBody}
  </soapenv:Body>
</soapenv:Envelope>`;

      const headers = {
  'Content-Type': 'text/xml; charset=utf-8',
  'Accept': 'text/xml',

  'SOAPAction': '"http://clientesapi.example.com/listar"'
};
      if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

     const res = await fetch(`${GATEWAY_URL}/soap/clientes`, {
  method: 'POST',
  headers,
  body: envelope
});
      const text = await res.text();
      return { status: res.status, xml: text };
    }
  },

  // --- COTIZACIONES MODULE ---
  cotizaciones: {
    async listar() {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/cotizaciones');
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      return [...memoryData.cotizaciones];
    },

    async crear(cotizacionData) {
      // Validate Client Active Status (simulates OpenFeign business rule)
      const client = memoryData.clientes.find(c => c.id === Number(cotizacionData.idCliente));
      if (!client || client.estado === false) {
        throw new Error('Regla de Negocio (OpenFeign): El cliente no existe o se encuentra inactivo.');
      }

      if (api.shouldUseLive()) {
  try {
    const clienteId = Number(cotizacionData.idCliente);
    const userId = Number(localStorage.getItem('userId'));

    return await api.request(`/cotizaciones/${clienteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(userId)
      },
      body: JSON.stringify(cotizacionData)
    });
  } catch (e) {
    if (api.mode === 'live') throw e;
  }
}

      const currentUser = api.getCurrentUser();
      const newCotiz = {
        id: memoryData.cotizaciones.length > 0 ? Math.max(...memoryData.cotizaciones.map(c => c.id)) + 1 : 1,
        fecha: cotizacionData.fecha || new Date().toISOString().split('T')[0],
        idCliente: Number(cotizacionData.idCliente),
        idUsuario: currentUser ? currentUser.id : 2,
        descripcion: cotizacionData.descripcion,
        montoEstimado: parseFloat(cotizacionData.montoEstimado) || 0,
        estado: cotizacionData.estado || 'BORRADOR',
        observaciones: cotizacionData.observaciones || ''
      };
      memoryData.cotizaciones.unshift(newCotiz);
      saveStore('cotizaciones', memoryData.cotizaciones);
      return newCotiz;
    },

    async actualizar(id, data) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/cotizaciones/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const index = memoryData.cotizaciones.findIndex(c => c.id === Number(id));
      if (index === -1) throw new Error('Cotización no encontrada');
      memoryData.cotizaciones[index] = { ...memoryData.cotizaciones[index], ...data };
      saveStore('cotizaciones', memoryData.cotizaciones);
      return memoryData.cotizaciones[index];
    },

    async eliminar(id) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/cotizaciones/${id}`, { method: 'DELETE' });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      memoryData.cotizaciones = memoryData.cotizaciones.filter(c => c.id !== Number(id));
      saveStore('cotizaciones', memoryData.cotizaciones);
      return { success: true };
    }
  },

  // --- LLAMADAS MODULE ---
  llamadas: {
    async listar() {
      if (api.shouldUseLive()) {
        try {
          return await api.request('/llamadas');
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      return [...memoryData.llamadas];
    },

    async crear(llamadaData) {
      // Validate Client with OpenFeign
      const client = memoryData.clientes.find(c => c.id === Number(llamadaData.idCliente));
      if (!client || client.estado === false) {
        throw new Error('Regla de Negocio (OpenFeign): No se puede registrar actividad a un cliente inactivo.');
      }

      if (api.shouldUseLive()) {
        try {
          return await api.request('/llamadas', {
            method: 'POST',
            body: JSON.stringify(llamadaData)
          });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }

      const currentUser = api.getCurrentUser();
      const newLlamada = {
        id: memoryData.llamadas.length > 0 ? Math.max(...memoryData.llamadas.map(l => l.id)) + 1 : 1,
        tipoLlamada: llamadaData.tipoLlamada || 'SALIENTE',
        observaciones: llamadaData.observaciones || '',
        fechaInicio: llamadaData.fechaInicio || new Date().toISOString().slice(0, 19),
        fechaFin: llamadaData.fechaFin || null,
        idUsuario: currentUser ? currentUser.id : 2,
        idCliente: Number(llamadaData.idCliente),
        numeroTelefono: llamadaData.numeroTelefono || client.telefono,
        estado: llamadaData.estado || 'FINALIZADA',
        resultado: llamadaData.resultado || 'ATENDIDA'
      };
      memoryData.llamadas.unshift(newLlamada);
      saveStore('llamadas', memoryData.llamadas);
      return newLlamada;
    },

    async actualizar(id, data) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/llamadas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      const index = memoryData.llamadas.findIndex(l => l.id === Number(id));
      if (index === -1) throw new Error('Llamada no encontrada');
      memoryData.llamadas[index] = { ...memoryData.llamadas[index], ...data };
      saveStore('llamadas', memoryData.llamadas);
      return memoryData.llamadas[index];
    },

    async eliminar(id) {
      if (api.shouldUseLive()) {
        try {
          return await api.request(`/llamadas/${id}`, { method: 'DELETE' });
        } catch (e) {
          if (api.mode === 'live') throw e;
        }
      }
      memoryData.llamadas = memoryData.llamadas.filter(l => l.id !== Number(id));
      saveStore('llamadas', memoryData.llamadas);
      return { success: true };
    }
  },

  // Helper to reset mock demo data
  resetDemoData() {
    localStorage.removeItem('crm_users');
    localStorage.removeItem('crm_clientes');
    localStorage.removeItem('crm_cotizaciones');
    localStorage.removeItem('crm_llamadas');
    memoryData = {
      users: [...INITIAL_USERS],
      clientes: [...INITIAL_CLIENTES],
      cotizaciones: [...INITIAL_COTIZACIONES],
      llamadas: [...INITIAL_LLAMADAS]
    };
  }
};
