import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Patient, Consultation } from '../types';
import { calculate, getAgeDecimal } from './calculations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function fmt(v: number | null | undefined): string {
  return v != null ? String(v) : '-';
}

function fmtDate(d: string) {
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: es }); } catch { return d; }
}

// Tabla reducida: solo los 4 indicadores clave
function buildSummaryRows(c: Consultation, sex: 'M' | 'F', birthDate: string): string[][] {
  const calc = calculate(c, sex, birthDate);
  return [
    ['Peso (kg)', fmt(c.weight)],
    ['IMC (kg/m²)', fmt(calc.imc)],
    ['Σ Pliegues (mm)', fmt(calc.sumFolds)],
    ['% Grasa (%)', fmt(calc.fatPct)],
  ];
}

async function captureElement(el: HTMLElement, IMG_W: number) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const imgH = (canvas.height * IMG_W) / canvas.width;
  return { imgData, imgH };
}

async function captureAnamnesisHTML(html: string, IMG_W: number): Promise<{ imgData: string; imgH: number } | null> {
  const plain = html.replace(/<[^>]*>/g, '').trim();
  if (!plain) return null;

  // Inject styles into document head temporarily so html2canvas picks them up
  const styleId = '__nc-anamnesis-style__';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      #__nc-anamnesis-render__ { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; line-height: 1.7; color: #1f2937; }
      #__nc-anamnesis-render__ p { margin: 5px 0; }
      #__nc-anamnesis-render__ ul { list-style-type: disc; padding-left: 22px; margin: 6px 0; }
      #__nc-anamnesis-render__ ol { list-style-type: decimal; padding-left: 22px; margin: 6px 0; }
      #__nc-anamnesis-render__ li { margin: 3px 0; }
      #__nc-anamnesis-render__ strong { font-weight: 700; }
      #__nc-anamnesis-render__ em { font-style: italic; }
      #__nc-anamnesis-render__ u { text-decoration: underline; }
    `;
    document.head.appendChild(styleEl);
  }

  const div = document.createElement('div');
  div.id = '__nc-anamnesis-render__';
  div.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;padding:14px 18px;background:#ffffff;';
  div.innerHTML = html;
  document.body.appendChild(div);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 700 });
    const imgData = canvas.toDataURL('image/png');
    const imgH = (canvas.height * IMG_W) / canvas.width;
    return { imgData, imgH };
  } finally {
    document.body.removeChild(div);
  }
}

export async function exportToPDF(
  patient: Patient,
  consultations: Consultation[],
  charts: {
    lineChartEl?: HTMLElement | null;
    barChartEl?: HTMLElement | null;
    histBarChartEl?: HTMLElement | null;
  } = {}
) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const age = Math.floor(getAgeDecimal(patient.birthDate));
  const PAGE_H = 297;
  const MARGIN_BOTTOM = 16;
  const IMG_W = 180;

  // ── Encabezado ──────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('NutriChart - Reporte Nutricional', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Paciente: ${patient.firstName} ${patient.lastName}`, 14, 28);
  doc.text(`Sexo: ${patient.sex === 'M' ? 'Masculino' : 'Femenino'}   Edad: ${age} años`, 14, 34);
  doc.text(`Fecha de nacimiento: ${fmtDate(patient.birthDate)}   Actividad: ${patient.activityLevel}`, 14, 40);
  doc.text(`Generado: ${fmtDate(new Date().toISOString())}`, 14, 46);

  let y = 54;

  // ── Capturar anamnesis en paralelo antes de construir el PDF ────────────
  const anamnesisResults: ({ imgData: string; imgH: number } | null)[] = await Promise.all(
    consultations.map((c) =>
      c.anamnesis ? captureAnamnesisHTML(c.anamnesis, IMG_W).catch(() => null) : Promise.resolve(null)
    )
  );

  // ── Tabla por consulta (solo 4 métricas) ────────────────────────────────
  for (const c of consultations) {
    if (y > 240) { doc.addPage(); y = 14; }

    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text(`Consulta: ${fmtDate(c.date)}`, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Parámetro', 'Valor']],
      body: buildSummaryRows(c, patient.sex, patient.birthDate),
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 122 },
        1: { cellWidth: 60, halign: 'center' },
      },
      tableWidth: 182,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
    y += 6;
  }

  const { lineChartEl, barChartEl, histBarChartEl } = charts;

  // ── Gráfico de barras — PDF de consulta individual ───────────────────────
  if (barChartEl) {
    try {
      const { imgData, imgH } = await captureElement(barChartEl, IMG_W);
      // El componente mide solo 175px de alto, lo que produce imgH muy pequeño.
      // Multiplicar por 2.2 da ~80-90mm, suficiente para barras y labels legibles.
      const displayH = imgH * 2.2;
      if (y + displayH + 14 > PAGE_H - MARGIN_BOTTOM) { doc.addPage(); y = 14; }
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text('Resumen visual de la consulta', 14, y);
      y += 6;
      doc.addImage(imgData, 'PNG', 14, y, IMG_W, displayH);
    } catch (e) {
      console.warn('No se pudo exportar el gráfico de barras:', e);
    }
  }

  // ── Gráficos históricos — PDF del historial completo ────────────────────
  if (lineChartEl || histBarChartEl) {
    doc.addPage();
    y = 14;
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    doc.text('Gráficos de Evolución', 14, y);
    y += 8;

    // Gráficos de línea (un div [data-chart] por métrica)
    if (lineChartEl) {
      try {
        const { default: html2canvas } = await import('html2canvas');
        const chartDivs = Array.from(lineChartEl.querySelectorAll<HTMLElement>('[data-chart]'));
        for (const div of chartDivs) {
          const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const imgH = (canvas.height * IMG_W) / canvas.width;
          if (y + imgH > PAGE_H - MARGIN_BOTTOM) { doc.addPage(); y = 14; }
          doc.addImage(imgData, 'PNG', 14, y, IMG_W, imgH);
          y += imgH + 6;
        }
      } catch (e) {
        console.warn('No se pudo exportar los gráficos de línea:', e);
      }
    }

    // Gráfico de barras histórico agrupado
    if (histBarChartEl) {
      try {
        const barEl = histBarChartEl.querySelector<HTMLElement>('[data-historical-bar]') ?? histBarChartEl;
        const { imgData, imgH } = await captureElement(barEl, IMG_W);
        if (y + imgH + 14 > PAGE_H - MARGIN_BOTTOM) { doc.addPage(); y = 14; }
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Comparativa por Consulta', 14, y);
        y += 6;
        doc.addImage(imgData, 'PNG', 14, y, IMG_W, imgH);
      } catch (e) {
        console.warn('No se pudo exportar el gráfico comparativo:', e);
      }
    }
  }

  // ── Anamnesis — al final del documento, después de todos los gráficos ───
  const consultationsWithAnamnesis = consultations.filter((_, i) => anamnesisResults[i] != null);
  if (consultationsWithAnamnesis.length > 0) {
    doc.addPage();
    y = 14;
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    doc.text('Anamnesis', 14, y);
    y += 8;

    for (let i = 0; i < consultations.length; i++) {
      const result = anamnesisResults[i];
      if (!result) continue;
      const c = consultations[i];

      if (y + result.imgH + 18 > PAGE_H - MARGIN_BOTTOM) { doc.addPage(); y = 14; }

      doc.setFontSize(10);
      doc.setTextColor(30, 64, 175);
      doc.text(`Consulta: ${fmtDate(c.date)}`, 14, y);
      y += 5;
      doc.addImage(result.imgData, 'PNG', 14, y, IMG_W, result.imgH);
      y += result.imgH + 10;
    }
  }

  doc.save(`reporte_${patient.lastName}_${patient.firstName}.pdf`);
}

export function exportToExcel(patient: Patient, consultations: Consultation[]) {
  const wb = XLSX.utils.book_new();

  const patientData = [
    ['NutriChart - Datos del Paciente'],
    [],
    ['Nombre', `${patient.firstName} ${patient.lastName}`],
    ['Sexo', patient.sex === 'M' ? 'Masculino' : 'Femenino'],
    ['Fecha de nacimiento', fmtDate(patient.birthDate)],
    ['Edad', `${Math.floor(getAgeDecimal(patient.birthDate))} años`],
    ['Nivel de actividad', patient.activityLevel],
    ['Teléfono', patient.phone || '-'],
    ['Email', patient.email || '-'],
    ['Notas', patient.notes || '-'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(patientData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Paciente');

  const headers = [
    'Fecha', 'Notas',
    'Peso (kg)', 'Talla (cm)', 'Talla sentada (cm)',
    'Brazo relajado (cm)', 'Brazo flexionado (cm)', 'Antebrazo (cm)',
    'Cintura mín (cm)', 'Caderas máx (cm)', 'Muslo medial (cm)', 'Pantorrilla máx (cm)',
    'Humeral (cm)', 'Femoral (cm)', 'Bi-estiloideo (cm)', 'Bi-maleolar (cm)',
    'Tríceps (mm)', 'Subescapular (mm)', 'Bíceps (mm)', 'Cresta Ilíaca (mm)',
    'Supraespinal (mm)', 'Abdominal (mm)', 'Muslo anterior (mm)', 'Pantorrilla medial (mm)',
    'IMC', '% Grasa', 'Kg Grasa', 'Kg Masa Magra',
    'Kg Músculo (Martin)', 'Kg Músculo (Lee)', 'Kg Esqueleto',
    '% Músculo', '% Esqueleto', 'Σ 8 Pliegues',
  ];

  const rows = consultations.map((c) => {
    const calc = calculate(c, patient.sex, patient.birthDate);
    return [
      fmtDate(c.date), c.anamnesis ? c.anamnesis.replace(/<[^>]*>/g, '').trim() : '',
      c.weight ?? '', c.height ?? '', c.sittingHeight ?? '',
      c.armRelaxed ?? '', c.armFlexed ?? '', c.forearm ?? '',
      c.waistMin ?? '', c.hipMax ?? '', c.medialThigh ?? '', c.maxCalf ?? '',
      c.humeral ?? '', c.femoral ?? '', c.bistyloid ?? '', c.bimalleolar ?? '',
      c.triceps ?? '', c.subscapular ?? '', c.biceps ?? '', c.iliacCrest ?? '',
      c.supraspinal ?? '', c.abdominal ?? '', c.anteriorThigh ?? '', c.medialCalf ?? '',
      calc.imc ?? '', calc.fatPct ?? '', calc.kgFat ?? '', calc.kgLean ?? '',
      calc.kgMuscleMartin ?? '', calc.kgMuscleLee ?? '', calc.kgSkeleton ?? '',
      calc.musclePct ?? '', calc.skeletonPct ?? '', calc.sumFolds ?? '',
    ];
  });

  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Consultas');

  XLSX.writeFile(wb, `nutrichart_${patient.lastName}_${patient.firstName}.xlsx`);
}
