import './style.css'

// Estado de la aplicación
let tareas = [];
let filtroActual = 'all';

// Elementos del DOM
const inputTarea = document.getElementById('taskInput');
const botonAgregar = document.getElementById('addBtn');
const listaTareas = document.getElementById('taskList');
const estadoVacio = document.getElementById('emptyState');
const botonLimpiarCompletadas = document.getElementById('clearCompleted');
const botonEliminarTodas = document.getElementById('deleteAll');
const botonesFiltro = document.querySelectorAll('.filter-btn');

// Contadores
const contadorTotal = document.getElementById('totalCount');
const contadorPendientes = document.getElementById('pendingCount');
const contadorCompletadas = document.getElementById('completedCount');

// Función de inicialización
function inicializar() {
  // Verificar que los elementos existen
  if (!inputTarea || !botonAgregar || !listaTareas || !estadoVacio) {
    console.error('Error: No se encontraron todos los elementos DOM');
    return;
  }
  
  cargarTareas();
  renderizarTareas();
  actualizarEstadisticas();
  actualizarBotonesAccion();
  
  // Event Listeners
  botonAgregar.addEventListener('click', agregarTarea);
  inputTarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarTarea();
  });

  inputTarea.addEventListener('input', () => {
    botonAgregar.disabled = inputTarea.value.trim() === '';
  });

  // Habilitar el botón inicialmente
  botonAgregar.disabled = false;

  botonesFiltro.forEach(boton => {
    boton.addEventListener('click', () => manejarCambioFiltro(boton));
  });

  if (botonLimpiarCompletadas) {
    botonLimpiarCompletadas.addEventListener('click', limpiarCompletadas);
  }
  
  if (botonEliminarTodas) {
    botonEliminarTodas.addEventListener('click', eliminarTodasLasTareas);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

// Funciones principales
function agregarTarea() {
  const texto = inputTarea.value.trim();
  
  if (texto === '') return;

  const nuevaTarea = {
    id: Date.now(),
    texto: texto,
    completada: false,
    fechaCreacion: new Date().toISOString()
  };

  tareas.unshift(nuevaTarea);
  inputTarea.value = '';
  botonAgregar.disabled = inputTarea.value.trim() === '';
  
  guardarTareas();
  renderizarTareas();
  actualizarEstadisticas();
  actualizarBotonesAccion();
  
  // Mostrar animación de éxito
  mostrarNotificacion('✅ Tarea agregada');
}

function renderizarTareas() {
  const tareasFiltradas = obtenerTareasFiltradas();
  
  if (tareasFiltradas.length === 0) {
    listaTareas.classList.add('hidden');
    estadoVacio.classList.remove('hidden');
    return;
  }

  listaTareas.classList.remove('hidden');
  estadoVacio.classList.add('hidden');
  
  listaTareas.innerHTML = '';
  
  tareasFiltradas.forEach((tarea) => {
    const elementoTarea = crearElementoTarea(tarea);
    listaTareas.appendChild(elementoTarea);
  });
}

function crearElementoTarea(tarea) {
  // Crear el HTML directamente
  const html = `
    <li class="task-item" data-id="${tarea.id}" style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; margin-bottom: 8px;">
      <button class="task-checkbox" style="width: 32px; height: 32px; border: 2px solid #64748b; border-radius: 6px; background: ${tarea.completada ? '#10b981' : 'transparent'}; color: white; cursor: pointer; margin-top: 2px; flex-shrink: 0;">
        ${tarea.completada ? '✓' : ''}
      </button>
      <div class="task-content" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
        <span class="task-text" style="color: ${tarea.completada ? '#9ca3af' : '#f1f5f9'}; ${tarea.completada ? 'text-decoration: line-through;' : ''} font-size: 16px; line-height: 1.4; word-wrap: break-word;">
          ${tarea.texto}
        </span>
        <small class="task-time" style="color: #64748b; font-size: 12px; margin-top: 4px; font-style: italic;">
          📅 ${formatearFecha(tarea.fechaCreacion)}
        </small>
      </div>
      <button class="delete-btn" style="color: #f87171; cursor: pointer; padding: 6px; border-radius: 4px; transition: all 0.2s; flex-shrink: 0;" onmouseover="this.style.background='#fca5a5'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='#f87171';">
        🗑️
      </button>
    </li>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const li = tempDiv.firstElementChild;
  
  // Eventos
  const checkbox = li.querySelector('.task-checkbox');
  const deleteBtn = li.querySelector('.delete-btn');
  
  checkbox.addEventListener('click', () => alternarTarea(tarea.id));
  deleteBtn.addEventListener('click', () => eliminarTarea(tarea.id));
  
  return li;
}

function alternarTarea(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;
  
  tarea.completada = !tarea.completada;
  
  guardarTareas();
  renderizarTareas();
  actualizarEstadisticas();
  actualizarBotonesAccion();
  
  const mensaje = tarea.completada ? '✅ Tarea completada' : '🔄 Tarea pendiente';
  mostrarNotificacion(mensaje);
}

function eliminarTarea(id) {
  const elementoTarea = document.querySelector(`[data-id="${id}"]`);
  if (elementoTarea) {
    elementoTarea.classList.add('task-item-exit');
    setTimeout(() => {
      tareas = tareas.filter(t => t.id !== id);
      guardarTareas();
      renderizarTareas();
      actualizarEstadisticas();
      actualizarBotonesAccion();
      mostrarNotificacion('🗑️ Tarea eliminada');
    }, 300);
  }
}

function limpiarCompletadas() {
  if (!confirm('¿Eliminar todas las tareas completadas?')) return;
  
  tareas = tareas.filter(tarea => !tarea.completada);
  guardarTareas();
  renderizarTareas();
  actualizarEstadisticas();
  actualizarBotonesAccion();
  mostrarNotificacion('🧹 Tareas completadas eliminadas');
}

function eliminarTodasLasTareas() {
  if (!confirm('⚠️ ¿Estás seguro de eliminar TODAS las tareas?')) return;
  
  tareas = [];
  guardarTareas();
  renderizarTareas();
  actualizarEstadisticas();
  actualizarBotonesAccion();
  mostrarNotificacion('💥 Todas las tareas eliminadas');
}

function manejarCambioFiltro(boton) {
  botonesFiltro.forEach(b => {
    b.className = b.className.replace(
      'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30',
      'bg-slate-700/50 text-slate-300 border-slate-600'
    );
  });
  
  boton.className = boton.className.replace(
    'bg-slate-700/50 text-slate-300 border-slate-600',
    'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30'
  );
  
  filtroActual = boton.dataset.filter;
  renderizarTareas();
}

function obtenerTareasFiltradas() {
  switch (filtroActual) {
    case 'pending':
      return tareas.filter(tarea => !tarea.completada);
    case 'completed':
      return tareas.filter(tarea => tarea.completada);
    default:
      return tareas;
  }
}

function actualizarEstadisticas() {
  const total = tareas.length;
  const pendientes = tareas.filter(t => !t.completada).length;
  const completadas = tareas.filter(t => t.completada).length;

  contadorTotal.textContent = total;
  contadorPendientes.textContent = pendientes;
  contadorCompletadas.textContent = completadas;
}

function actualizarBotonesAccion() {
  const hayCompletadas = tareas.some(tarea => tarea.completada);
  const hayTareas = tareas.length > 0;
  
  if (hayCompletadas) {
    botonLimpiarCompletadas.classList.remove('hidden');
  } else {
    botonLimpiarCompletadas.classList.add('hidden');
  }
  
  if (hayTareas) {
    botonEliminarTodas.classList.remove('hidden');
  } else {
    botonEliminarTodas.classList.add('hidden');
  }
}

function formatearFecha(cadenaISO) {
  const fecha = new Date(cadenaISO);
  const ahora = new Date();
  const diferencia = ahora - fecha;
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(diferencia / 3600000);
  const dias = Math.floor(diferencia / 86400000);
  
  if (segundos < 30) return 'Ahora mismo';
  if (minutos < 1) return 'Hace menos de 1 min';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas}h`;
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  
  return fecha.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short',
    year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
  });
}

function mostrarNotificacion(mensaje) {
  const notificacion = document.createElement('div');
  notificacion.className = `fixed top-8 right-8 bg-slate-800 text-white px-6 py-4 rounded-2xl 
                           shadow-2xl border-2 border-indigo-500/50 z-50 animate-bounce`;
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }, 2000);
}

// LocalStorage
function guardarTareas() {
  localStorage.setItem('taskmaster-tareas', JSON.stringify(tareas));
}

function cargarTareas() {
  const almacenado = localStorage.getItem('taskmaster-tareas');
  if (almacenado) {
    tareas = JSON.parse(almacenado);
  }
}