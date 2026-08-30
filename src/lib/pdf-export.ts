import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface PdfColumn {
  header: string;
  key: string;
  width?: string;
}

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  hideLogo?: boolean;
  columns?: PdfColumn[];
  rows?: Record<string, any>[];
  htmlBody?: string;
  images?: string[];
}

export async function exportToPdf(options: ExportPdfOptions): Promise<void> {
  const { title, subtitle, logoUrl, hideLogo, columns = [], rows = [], htmlBody, images = [] } = options;

  let tableHtml = '';
  if (columns.length > 0 && rows.length > 0) {
    const ths = columns.map((c) => `<th style="width: ${c.width || 'auto'};">${c.header}</th>`).join('');
    const trs = rows
      .map((r, idx) => {
        const tds = columns
          .map((c) => {
            let val = r[c.key] ?? '';
            // If value is a web URL, format as clean clickable download link
            if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
              val = `<a href="${val}" target="_blank" style="color: #2B6CB0; font-weight: 600; text-decoration: underline;">🔗 View / Download</a>`;
            }
            return `<td>${val}</td>`;
          })
          .join('');

        return `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">${tds}</tr>`;
      })
      .join('');

    tableHtml = `
      <table>
        <thead>
          <tr>${ths}</tr>
        </thead>
        <tbody>
          ${trs}
        </tbody>
      </table>
    `;
  }

  let imagesHtml = '';
  if (images.length > 0) {
    const imgs = images
      .filter((url) => !!url)
      .map(
        (url) => `
        <div class="img-box">
          <img src="${url}" alt="Attachment" />
          <a href="${url}" target="_blank" class="dl-btn">🔗 Download</a>
        </div>`
      )
      .join('');
    imagesHtml = `
      <div class="gallery-section">
        <h3>Attached Media &amp; Photos</h3>
        <div class="gallery-grid">${imgs}</div>
      </div>
    `;
  }

  const logoHtml = !hideLogo && logoUrl && logoUrl.startsWith('http')
    ? `<img src="${logoUrl}" class="header-logo" alt="School Logo" />`
    : '';

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 20px;
            color: #1A202C;
            background-color: #FFFFFF;
          }
          .header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #2B6CB0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #2B6CB0;
          }
          .subtitle {
            font-size: 13px;
            color: #4A5568;
            margin-top: 2px;
          }
          .meta {
            font-size: 11px;
            color: #718096;
            margin-top: 4px;
          }
          .header-logo {
            max-height: 48px;
            max-width: 140px;
            object-fit: contain;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 12px;
          }
          th, td {
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #E2E8F0;
          }
          th {
            background-color: #EDF2F7;
            color: #2D3748;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          tr.even {
            background-color: #FFFFFF;
          }
          tr.odd {
            background-color: #F7FAFC;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .badge-success { background-color: #C6F6D5; color: #22543D; }
          .badge-danger { background-color: #FED7D7; color: #742A2A; }
          .badge-warning { background-color: #FEFCBF; color: #744210; }
          .gallery-section {
            margin-top: 24px;
          }
          .gallery-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
          }
          .img-box {
            width: 130px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #E2E8F0;
            text-align: center;
            padding-bottom: 6px;
            background-color: #F7FAFC;
          }
          .img-box img {
            width: 100%;
            height: 110px;
            object-fit: cover;
          }
          .dl-btn {
            display: inline-block;
            margin-top: 4px;
            font-size: 11px;
            color: #2B6CB0;
            font-weight: 600;
            text-decoration: underline;
          }
          .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #A0AEC0;
            text-align: center;
            border-top: 1px solid #E2E8F0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header-row">
          <div>
            <div class="title">${title}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
            <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          </div>
          ${logoHtml}
        </div>
        ${htmlBody ? htmlBody : ''}
        ${tableHtml}
        ${imagesHtml}
        <div class="footer">Exported from School Management Mobile App</div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html: fullHtml });
    return;
  }

  const result = await Print.printToFileAsync({ html: fullHtml });
  if (result && result.uri) {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: `Export ${title}` });
    }
  }
}

export interface HomeworkPdfData {
  title: string;
  subject: string;
  date: string;
  description: string;
  teacherName?: string | null;
  attachments?: string[];
  submission?: {
    studentName?: string | null;
    studentSrn?: string | null;
    submittedAt?: string | null;
    description?: string | null;
    photos?: string[];
    status?: string;
    rating?: string | null;
    teacherRemarks?: string | null;
    signatureUrl?: string | null;
  } | null;
}

export async function exportHomeworkToPdf(data: HomeworkPdfData): Promise<void> {
  const allImages = [
    ...(data.attachments || []),
    ...(data.submission?.photos || []),
  ].filter(Boolean);

  let htmlBody = `
    <div style="background-color: #F7FAFC; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 16px;">
      <h2 style="margin:0 0 8px 0; color: #2D3748;">Subject: ${data.subject}</h2>
      <p style="margin: 4px 0; color: #4A5568;"><strong>Date:</strong> ${data.date}</p>
      ${data.teacherName ? `<p style="margin: 4px 0; color: #4A5568;"><strong>Assigned By:</strong> ${data.teacherName}</p>` : ''}
      <div style="margin-top: 12px; padding: 12px; background-color: #FFFFFF; border-radius: 6px; border-left: 4px solid #3182CE;">
        <strong>Homework Instructions:</strong>
        <p style="margin-top: 4px; white-space: pre-wrap; color: #2D3748;">${data.description || 'No description provided.'}</p>
      </div>
    </div>
  `;

  if (data.submission) {
    const sub = data.submission;
    const ratingDisplay = sub.rating
      ? `<span style="display:inline-block; padding: 4px 10px; border-radius: 20px; background-color: #FEFCBF; color: #744210; font-weight: bold; font-size: 13px;">Grade: ${sub.rating}</span>`
      : '';

    const signatureDisplay = sub.signatureUrl
      ? `<div style="margin-top: 16px; text-align: right; border-top: 1px dashed #CBD5E0; padding-top: 12px;">
          <p style="font-size: 11px; color: #718096; margin-bottom: 4px;">Verified &amp; Signed By Teacher</p>
          <img src="${sub.signatureUrl}" alt="Teacher Signature" style="max-height: 50px; max-width: 150px; object-fit: contain;" />
        </div>`
      : '';

    htmlBody += `
      <div style="background-color: #EDF2F7; padding: 16px; border-radius: 8px; border: 1px solid #CBD5E0; margin-bottom: 16px;">
        <div style="display:flex; justify-content: space-between; align-items: center;">
          <h3 style="margin:0; color: #2D3748;">Student Homework Submission</h3>
          ${ratingDisplay}
        </div>
        ${sub.studentName ? `<p style="margin: 6px 0; color: #4A5568;"><strong>Student:</strong> ${sub.studentName} (${sub.studentSrn || ''})</p>` : ''}
        ${sub.submittedAt ? `<p style="margin: 4px 0; color: #718096; font-size: 12px;">Submitted: ${sub.submittedAt}</p>` : ''}
        
        ${sub.description ? `<div style="margin-top: 8px; padding: 10px; background-color: #FFFFFF; border-radius: 6px;"><strong>Student Notes:</strong><p style="margin-top:2px;">${sub.description}</p></div>` : ''}
        ${sub.teacherRemarks ? `<div style="margin-top: 8px; padding: 10px; background-color: #EBF8FF; border-left: 3px solid #3182CE; border-radius: 4px;"><strong>Teacher Feedback:</strong><p style="margin-top:2px; color: #2B6CB0;">${sub.teacherRemarks}</p></div>` : ''}
        
        ${signatureDisplay}
      </div>
    `;
  }

  await exportToPdf({
    title: `Homework - ${data.subject}`,
    subtitle: `Date: ${data.date}`,
    htmlBody,
    images: allImages,
  });
}
