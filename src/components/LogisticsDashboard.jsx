import React, { useMemo, useState } from "react";

// --- ESTILOS CSS V5 (CORREÇÃO DE IMPRESSÃO MULTIPÁGINA) ---
const modalStyles = `
  /* ESTILOS DE TELA (SCREEN) */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }
  .modal-content {
    background: #fff; color: #1e293b;
    width: 850px; 
    max-width: 95%; max-height: 90vh;
    border-radius: 12px; 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex; 
    flex-direction: column;
    overflow: hidden; /* Importante para tela, ruim para impressão (corrigido abaixo) */
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .invoice-header {
    padding: 30px 40px; background: #fff; border-bottom: 2px solid #0f172a;
    display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;
  }
  .brand-section { display: flex; flex-direction: column; gap: 4px; }
  .doc-type { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #64748b; }
  .store-name { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1; margin: 0; }
  .store-meta { font-size: 14px; color: #64748b; font-weight: 500; margin-top: 4px; }

  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: right; }
  .detail-group { display: flex; flex-direction: column; }
  .detail-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 2px; }
  .detail-value { font-size: 14px; font-weight: 600; color: #334155; }

  .modal-body {
    padding: 0; overflow-y: auto; background: #fff; flex-grow: 1;
  }

  .order-table { width: 100%; border-collapse: collapse; }
  .order-table th { 
    background: #f8fafc; color: #475569; text-align: left; padding: 14px 20px; 
    font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0; position: sticky; top: 0;
  }
  .order-table th:first-child { padding-left: 40px; }
  .order-table td { padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; font-size: 13px; }
  .order-table td:first-child { padding-left: 40px; }
  .order-table tr:hover { background: #f8fafc; }
  
  .sku-badge { font-family: monospace; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .qty-badge { font-weight: 700; color: #0f172a; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; padding: 4px 12px; display: inline-block; }

  .modal-footer {
    padding: 20px 40px; border-top: 1px solid #e2e8f0; background: #f8fafc; 
    display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0;
  }
  
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; border: 1px solid transparent; outline: none; }
  .btn:active { transform: translateY(1px); }
  .btn-secondary { background: #fff; border: 1px solid #cbd5e1; color: #475569; }
  .btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; color: #1e293b; }
  .btn-primary { background: #0f172a; color: #fff; border: 1px solid #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .btn-primary:hover { background: #1e293b; transform: translateY(-1px); }

  @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }

  /* --- MODO DE IMPRESSÃO (CORRIGIDO PARA MULTIPÁGINAS) --- */
  @media print {
    @page { size: A4; margin: 15mm; }
    
    body * { visibility: hidden; } /* Esconde tudo */
    
    /* Configura o overlay para sumir e deixar o conteúdo fluir */
    .modal-overlay { 
      position: static; display: block; background: none; 
      width: 100%; height: auto; overflow: visible;
    }
    
    /* Configura o modal para ocupar a folha inteira */
    .modal-content, .modal-content * { visibility: visible; }
    .modal-content {
      position: relative; left: 0; top: 0; 
      width: 100% !important; max-width: 100% !important;
      height: auto !important; max-height: none !important;
      overflow: visible !important; /* Permite que o conteúdo vaze para a próxima página */
      box-shadow: none; border: none; border-radius: 0;
      margin: 0; padding: 0;
      display: block; /* Remove o flexbox para evitar bugs de quebra de página */
    }

    /* Esconde rolagem interna */
    .modal-body { overflow: visible !important; height: auto !important; }

    /* Esconde botões */
    .modal-footer { display: none; } 
    .no-print { display: none !important; }

    /* Configura a Tabela para quebra de página inteligente */
    .order-table { width: 100%; }
    .order-table thead { display: table-header-group; } /* Repete cabeçalho em cada página */
    .order-table tr { page-break-inside: avoid; } /* Evita cortar linha ao meio */
    
    .print-footer {
      display: flex !important; margin-top: 40px; padding: 0 40px;
      justify-content: space-between; page-break-inside: avoid;
    }
    .sign-box {
      border-top: 1px solid #000; width: 40%; padding-top: 8px;
      text-align: center; font-size: 11px; text-transform: uppercase;
    }
  }
  .print-footer { display: none; }
`;

export default function LogisticsDashboard({ lojasMap, stockRows }) {
  const [selectedLoja, setSelectedLoja] = useState(null);

  if (!lojasMap || lojasMap.size === 0) return <div className="card" style={{padding:"20px"}}>Carregando dados logísticos...</div>;

  const todayDate = new Date();
  const daysOfWeek = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const todayName = daysOfWeek[todayDate.getDay()]; 

  const superClean = (str) => {
    return String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 
  };

  const getPrevisao = (leadTime) => {
    let daysToAdd = parseInt(leadTime) || 1;
    let date = new Date();
    let daysAdded = 0;
    while (daysAdded < daysToAdd) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) daysAdded++;
    }
    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
  };

  const agenda = useMemo(() => {
    const grid = { "Segunda-Feira": [], "Terça-Feira": [], "Quarta-Feira": [], "Quinta-Feira": [], "Sexta-Feira": [] };
    
    lojasMap.forEach((loja, key) => {
      let dia = loja.diasAtendimento?.trim();
      if (!dia) return;

      if (dia.match(/Segunda/i)) dia = "Segunda-Feira";
      else if (dia.match(/Terça|Terca/i)) dia = "Terça-Feira";
      else if (dia.match(/Quarta/i)) dia = "Quarta-Feira";
      else if (dia.match(/Quinta/i)) dia = "Quinta-Feira";
      else if (dia.match(/Sexta/i)) dia = "Sexta-Feira";
      else return;

      const targetLabClean = superClean(key); 
      const storeItems = stockRows.filter(r => {
        const rowLabClean = superClean(r.Laboratorio);
        return rowLabClean === targetLabClean || rowLabClean.includes(targetLabClean) || targetLabClean.includes(rowLabClean);
      });
      
      const itemsToSend = storeItems
        .filter(r => r.ReposicaoSugeridaBruta > 0)
        .sort((a, b) => b.ReposicaoSugeridaBruta - a.ReposicaoSugeridaBruta);

      const totalPecas = itemsToSend.reduce((acc, curr) => acc + curr.ReposicaoSugeridaBruta, 0);

      if (grid[dia]) {
        grid[dia].push({ 
          ...loja, labKey: key, chegada: getPrevisao(loja.tempoEntrega),
          urgent: totalPecas > 0, itemsCount: totalPecas, items: itemsToSend 
        });
      }
    });
    return grid;
  }, [lojasMap, stockRows]);

  const getOrderId = (loja) => {
    const d = new Date();
    const dateStr = `${d.getDate()}${d.getMonth()+1}`;
    return `REQ-${dateStr}-${loja.id || '00'}`;
  }

  return (
    <>
      <style>{modalStyles}</style>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", background: "linear-gradient(90deg, var(--panelSolid) 0%, var(--bg) 100%)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Agenda Semanal de Envios</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Hoje é <strong>{todayName}</strong></p>
          </div>
          <div className="chip" style={{background: "var(--accent)", color: "#fff"}}>{agenda[todayName]?.length || 0} Envios Hoje</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          {Object.keys(agenda).map((dia) => {
             const isToday = dia === todayName;
             return (
              <div key={dia} className="card" style={{ padding: "0", border: isToday ? "2px solid var(--accent)" : "1px solid var(--border)", opacity: (isToday || agenda[dia].length > 0) ? 1 : 0.6 }}>
                <div style={{ padding: "12px", background: isToday ? "var(--accent)" : "var(--table-header-bg)", color: isToday ? "#fff" : "var(--textSec)", textAlign: "center", fontWeight: "bold" }}>
                  {dia.replace("-Feira", "")}
                </div>
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {agenda[dia].map(loja => (
                    <div key={loja.id} onClick={() => setSelectedLoja(loja)}
                      style={{ 
                        background: "var(--bg)", padding: "12px", borderRadius: "8px", 
                        border: loja.urgent ? "1px solid #f97316" : "1px solid var(--border2)",
                        borderLeft: loja.urgent ? "4px solid #f97316" : "4px solid #10b981",
                        cursor: "pointer", transition: "transform 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{ fontWeight: "600", fontSize: "12px", marginBottom: "4px", color: "var(--text)" }}>{loja.nomeFantasia}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span className="chip" style={{fontSize:"9px", height:"auto", padding: "2px 6px"}}>{loja.uf}</span>
                        {loja.urgent && <span style={{fontSize:"10px", color: "#f97316", fontWeight: "bold"}}>⚠️ {loja.itemsCount} pçs</span>}
                      </div>
                      <div style={{fontSize:"10px", color:"var(--textSec)", marginTop:"6px", textAlign:"right"}}>Chega: {loja.chegada}</div>
                    </div>
                  ))}
                  {agenda[dia].length === 0 && <div style={{textAlign:"center", fontSize:"11px", color:"var(--textSec)"}}>Sem envios.</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedLoja && (
        <div className="modal-overlay" onClick={() => setSelectedLoja(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            <div className="invoice-header">
              <div className="brand-section">
                <span className="doc-type">Ordem de Separação</span>
                <h1 className="store-name">{selectedLoja.nomeFantasia}</h1>
                <span className="store-meta">Destino: {selectedLoja.uf} (Logística Reversa / Reposição)</span>
              </div>
              <div className="details-grid">
                <div className="detail-group">
                  <span className="detail-label">ID Pedido</span>
                  <span className="detail-value">{getOrderId(selectedLoja)}</span>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Data Emissão</span>
                  <span className="detail-value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Previsão Entrega</span>
                  <span className="detail-value">{selectedLoja.chegada}</span>
                </div>
                 <div className="detail-group">
                  <span className="detail-label">Total Itens</span>
                  <span className="detail-value">{selectedLoja.itemsCount} pçs</span>
                </div>
              </div>
            </div>

            <div className="modal-body">
              {selectedLoja.items && selectedLoja.items.length > 0 ? (
                <table className="order-table">
                  <thead>
                    <tr>
                      <th style={{width: "15%"}}>Código SKU</th>
                      <th style={{width: "45%"}}>Descrição do Produto</th>
                      <th style={{width: "25%"}}>Categoria</th>
                      <th style={{width: "15%", textAlign: "center"}}>Qtd. Envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLoja.items.map((item, idx) => (
                      <tr key={idx}>
                        <td><span className="sku-badge">{item.SKU}</span></td>
                        <td style={{fontWeight: "600"}}>{item.Descricao}</td>
                        <td style={{color: "#64748b"}}>{item.Categoria}</td>
                        <td style={{textAlign: "center"}}>
                          <span className="qty-badge">{item.ReposicaoSugeridaBruta}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                  <div style={{fontSize: "40px", marginBottom: "16px", opacity: 0.3}}>✅</div>
                  <strong style={{fontSize: "16px", color: "#334155"}}>Estoque Regularizado</strong>
                  <p style={{margin: "8px 0 0 0", fontSize: "14px"}}>Nenhum item atingiu o ponto de reposição para esta loja hoje.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLoja(null)}>
                Fechar
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                🖨️ Imprimir Ordem
              </button>
            </div>

            <div className="print-footer">
               <div className="sign-box">Assinatura Expedição</div>
               <div className="sign-box">Assinatura Conferência (Loja)</div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}