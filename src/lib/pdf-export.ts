import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
          .header-logo {
            max-height: 48px;
            max-width: 120px;
            object-fit: contain;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            color: #2B6CB0;
            margin: 0 0 4px 0;
          }
          .subtitle {
            font-size: 13px;
            color: #4A5568;
            margin: 0;
          }
          .meta {
            font-size: 11px;
            color: #718096;
            margin-top: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
          }
          th {
            background-color: #2B6CB0;
            color: #FFFFFF;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #2B6CB0;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #E2E8F0;
            vertical-align: top;
          }
          tr.even {
            background-color: #F7FAFC;
          }
          tr.odd {
            background-color: #FFFFFF;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
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

  const { uri } = await Print.printToFileAsync({ html: fullHtml });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Export ${title}` });
  }
}
