import React, { useState, useMemo } from "react";

// --- ESTILOS CSS V4 (UX REFINADA & VISUAL LIMPO) ---
const styles = `
  .pd-container {
    display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #0f172a; height: 100%; width: 100%;
  }

  /* HEADER DE AÇÃO (KPI + EXPORT) - TÍTULO REMOVIDO PARA GANHAR ESPAÇO */
  .pd-actions-bar {
    display: flex; justify-content: space-between; align-items: flex-end;
    background: #fff; padding: 16px 24px; border-radius: 8px;
    border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .pd-kpi-group { display: flex; gap: 24px; }
  .pd-kpi-item { display: flex; flex-direction: column; align-items: flex-end; }
  .pd-kpi-val { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1; }
  .pd-kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 4px; }
  .val-highlight { color: #d97706; } /* Laranja para destacar ação */

  .btn-export {
    background: #10b981; color: white; border: none; padding: 10px 20px;
    border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  }
  .btn-export:hover { background: #059669; transform: translateY(-1px); }

  /* BARRA DE FILTROS OTIMIZADA */
  .pd-filters-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 16px 24px;
    display: grid; grid-template-columns: 1fr 1.5fr 2fr auto; gap: 16px; align-items: end;
  }
  
  .pd-input-group { display: flex; flex-direction: column; gap: 6px; }
  .pd-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; }
  
  .pd-input, .pd-select {
    width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid #cbd5e1;
    font-size: 13px; outline: none; background: white; color: #334155; transition: border 0.2s;
  }
  .pd-input:focus, .pd-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

  /* CHECKBOX OTIMIZADO (GESTALT) */
  .checkbox-wrapper {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 6px;
    background: #f8fafc; transition: all 0.2s; height: 38px;
  }
  .checkbox-wrapper:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .checkbox-wrapper input { width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; }
  .checkbox-label { font-size: 13px; font-weight: 500; color: #334155; user-select: none; }

  /* TABELA LIMPA */
  .pd-table-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
    flex: 1; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  .pd-table-container { overflow-y: auto; flex: 1; }
  
  .pd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .pd-table th {
    background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px;
    padding: 12px 20px; text-align: left; 
    position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #e2e8f0;
  }
  .pd-table td { padding: 10px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .pd-table tr { cursor: pointer; transition: background 0.15s; }
  .pd-table tr:hover { background: #f1f5f9; }

  /* TIPOGRAFIA DA TABELA */
  .prod-desc { font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 2px; }
  .prod-meta { font-size: 11px; color: #94a3b8; font-weight: 400; display: flex; gap: 8px; }
  
  .val-zero { color: #e2e8f0; font-weight: 400; } /* Zeros cinza claro */
  .val-num { color: #334155; font-weight: 600; }
  
  .col-center { text-align: center; }
  .col-right { text-align: right; }

  /* BADGES DE STATUS */
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; letter-spacing: 0.02em; }
  .bg-red { background: #fee2e2; color: #991b1b; } /* Ruptura/Crítico */
  .bg-orange { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; } /* Atenção */
  .bg-yellow { background: #fefce8; color: #a16207; border: 1px solid #fef08a; } /* Excesso (Dinheiro parado) */
  .bg-green { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; } /* Saudável */

  .sug-cell { 
    background: #fffbeb; color: #b45309; font-weight: 800; font-size: 14px; 
    border-left: 3px solid #f59e0b;
  }

  /* MODAL */
  .detail-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  }
  .detail-card {
    background: white; width: 500px; max-width: 95%;
    border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    overflow: hidden; display: flex; flex-direction: column;
    animation: fadeIn 0.2s ease-out;
  }
  .detail-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 20px; }
  .detail-body { padding: 0; max-height: 60vh; overflow-y: auto; }
  .lab-row { 
    display: flex; justify-content: space-between; padding: 14px 24px; 
    border-bottom: 1px solid #f1f5f9; font-size: 13px; 
  }
  
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
`;

export default function PurchaseDashboard({ prodMap, matrizMap, labSnapMap, movRows }) {
  const [targetMonths, setTargetMonths] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [hideOk, setHideOk] = useState(false);
  const [detailSku, setDetailSku] = useState(null);

  // --- DADOS (Mesma lógica) ---
  const stats = useMemo(() => {
    const uniqueMonths = new Set(movRows.map(r => r.Mes).filter(Boolean));
    const numMonths = uniqueMonths.size || 1; 
    const consumptionBySku = new Map();
    movRows.forEach(row => {
      const sku = String(row.SKU);
      const qtd = (row.Vendas || 0) + (row.OutrasSaidas || 0); 
      if (!consumptionBySku.has(sku)) consumptionBySku.set(sku, 0);
      consumptionBySku.set(sku, consumptionBySku.get(sku) + qtd);
    });
    return { consumptionBySku, numMonths };
  }, [movRows]);

  const rows = useMemo(() => {
    const data = [];
    const categories = new Set();
    prodMap.forEach((prod, sku) => {
      categories.add(prod.categoria);
      if (selectedCategory !== "Todas" && prod.categoria !== selectedCategory) return;
      if (searchTerm && !prod.descricao.toLowerCase().includes(searchTerm.toLowerCase()) && !sku.includes(searchTerm)) return;

      const totalConsumoPeriodo = stats.consumptionBySku.get(sku) || 0;
      const giroMensal = totalConsumoPeriodo / stats.numMonths;
      const estMatriz = matrizMap.get(sku) || 0;
      
      const breakdown = [];
      let estLabs = 0;
      for (const [key, qtd] of labSnapMap.entries()) {
        if (key.endsWith(`__${sku}`)) {
          estLabs += qtd;
          const labName = key.split('__')[0];
          if (qtd > 0) breakdown.push({ lab: labName, qtd });
        }
      }
      
      const estRede = estMatriz + estLabs;
      const coberturaMeses = giroMensal > 0 ? (estRede / giroMensal) : (estRede > 0 ? 999 : 0);
      const metaEstoque = giroMensal * targetMonths;
      let sugestao = metaEstoque - estRede;
      if (sugestao < 0) sugestao = 0;
      sugestao = Math.ceil(sugestao);

      // Status Lógica V4
      let statusLabel = "Saudável"; let statusClass = "bg-green";
      
      if (estRede === 0 && giroMensal > 0) { 
        statusLabel = "RUPTURA"; statusClass = "bg-red"; 
      } else if (coberturaMeses < 1 && giroMensal > 0) { 
        statusLabel = "Crítico"; statusClass = "bg-red"; 
      } else if (coberturaMeses < targetMonths * 0.5) { 
        statusLabel = "Atenção"; statusClass = "bg-orange"; 
      } else if (coberturaMeses > targetMonths * 2 && estRede > 10) { 
        // Excesso agora é amarelo/ouro (Dinheiro parado)
        statusLabel = "Excesso"; statusClass = "bg-yellow"; 
      }

      if (hideOk && sugestao <= 0) return;

      data.push({
        sku, descricao: prod.descricao, categoria: prod.categoria,
        giroMensal, estMatriz, estLabs, estRede, coberturaMeses, sugestao,
        statusLabel, statusClass, breakdown
      });
    });
    return { 
      data: data.sort((a, b) => b.sugestao - a.sugestao || b.giroMensal - a.giroMensal), 
      categories: Array.from(categories).sort() 
    };
  }, [prodMap, matrizMap, labSnapMap, stats, targetMonths, selectedCategory, searchTerm, hideOk]);

  const fmt = (n) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
  
  // Renderiza número ou traço se for zero
  const renderNum = (n) => n === 0 ? <span className="val-zero">-</span> : <span className="val-num">{n}</span>;

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SKU;Produto;Categoria;Giro Mensal;Estoque Matriz;Estoque Filiais;Total Rede;Cobertura (Meses);Sugestao Compra;Status\n";
    rows.data.forEach(r => {
      const line = `${r.sku};"${r.descricao}";${r.categoria};${fmt(r.giroMensal)};${r.estMatriz};${r.estLabs};${r.estRede};${fmt(r.coberturaMeses)};${r.sugestao};${r.statusLabel}`;
      csvContent += line + "\n";
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "sugestao_compra.csv");
    document.body.appendChild(link);
    link.click();
  };

  const selectedItem = detailSku ? rows.data.find(r => r.sku === detailSku) : null;

  return (
    <>
      <style>{styles}</style>
      <div className="pd-container">
        
        {/* BARRA DE AÇÃO SUPERIOR */}
        <div className="pd-actions-bar">
          <div className="pd-kpi-group">
            <div className="pd-kpi-item">
              <div className="pd-kpi-val val-highlight">{rows.data.filter(r => r.sugestao > 0).length}</div>
              <div className="pd-kpi-label">Itens p/ Pedir</div>
            </div>
            <div className="pd-kpi-item">
               {/* KPI Secundário opcional, ex: Rupturas */}
              <div className="pd-kpi-val" style={{color:'#ef4444'}}>{rows.data.filter(r => r.estRede === 0 && r.giroMensal > 0).length}</div>
              <div className="pd-kpi-label">Rupturas (Zerados)</div>
            </div>
          </div>
          <button className="btn-export" onClick={handleExport}>
             Exportar Planilha de Compra
          </button>
        </div>

        {/* FILTROS E CONTROLES */}
        <div className="pd-filters-card">
          <div className="pd-input-group">
            <label className="pd-label">Meta Cobertura (Meses)</label>
            <input type="number" className="pd-input" value={targetMonths} onChange={e=>setTargetMonths(Number(e.target.value))} step="0.5" />
          </div>
          <div className="pd-input-group">
            <label className="pd-label">Categoria</label>
            <select className="pd-select" value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}>
              <option value="Todas">Todas as Categorias</option>
              {rows.categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pd-input-group">
            <label className="pd-label">Buscar Produto</label>
            <input type="text" className="pd-input" placeholder="Digite SKU ou Modelo..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          </div>
          
          {/* CHECKBOX CORRIGIDO (GESTALT) */}
          <label className="checkbox-wrapper">
            <input type="checkbox" checked={hideOk} onChange={e=>setHideOk(e.target.checked)} />
            <span className="checkbox-label">Esconder itens sem compra</span>
          </label>
        </div>

        {/* TABELA */}
        <div className="pd-table-card">
          <div className="pd-table-container">
            <table className="pd-table">
              <thead>
                <tr>
                  <th style={{width:'35%'}}>Produto</th>
                  <th className="col-center">Giro (Mês)</th>
                  <th className="col-center">Matriz</th>
                  <th className="col-center">Filiais</th>
                  <th className="col-center">Total Rede</th>
                  <th className="col-center">Cob. (Meses)</th>
                  <th className="col-center">Status</th>
                  <th className="col-right">Sugestão</th>
                </tr>
              </thead>
              <tbody>
                {rows.data.slice(0, 500).map(row => (
                  <tr key={row.sku} onClick={() => setDetailSku(row.sku)} title="Clique para ver detalhes">
                    <td>
                      <div className="prod-desc">{row.descricao}</div>
                      <div className="prod-meta">
                        <span>SKU: {row.sku}</span>
                        <span>•</span>
                        <span>{row.categoria}</span>
                      </div>
                    </td>
                    <td className="col-center">{fmt(row.giroMensal)}</td>
                    <td className="col-center">{renderNum(row.estMatriz)}</td>
                    <td className="col-center">{renderNum(row.estLabs)}</td>
                    <td className="col-center" style={{fontWeight:700}}>{renderNum(row.estRede)}</td>
                    <td className="col-center">{fmt(row.coberturaMeses)}</td>
                    <td className="col-center"><span className={`badge ${row.statusClass}`}>{row.statusLabel}</span></td>
                    <td className={`col-right ${row.sugestao > 0 ? 'sug-cell' : ''}`}>
                      {row.sugestao > 0 ? row.sugestao : '-'}
                    </td>
                  </tr>
                ))}
                {rows.data.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Nenhum resultado para os filtros.</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', fontSize:'11px', color:'#64748b', textAlign:'center'}}>
            Mostrando os top 500 itens. Use os filtros para refinar.
          </div>
        </div>

      </div>

      {/* MODAL DETALHES */}
      {selectedItem && (
        <div className="detail-overlay" onClick={() => setDetailSku(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3 style={{margin:0, fontSize:'16px', color:'#1e293b'}}>{selectedItem.descricao}</h3>
              <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>Estoque Total na Rede: <strong>{selectedItem.estRede}</strong></div>
            </div>
            <div className="detail-body">
              <div className="lab-row" style={{background:'#f1f5f9'}}>
                <span className="lab-name">🏢 Matriz (Central)</span>
                <span className="lab-qty">{selectedItem.estMatriz}</span>
              </div>
              {selectedItem.breakdown.sort((a,b) => b.qtd - a.qtd).map((item, idx) => (
                <div key={idx} className="lab-row">
                  <span className="lab-name">{item.lab}</span>
                  <span className="lab-qty">{item.qtd}</span>
                </div>
              ))}
              {selectedItem.breakdown.length === 0 && selectedItem.estMatriz === 0 && (
                <div style={{padding:'30px', textAlign:'center', color:'#cbd5e1'}}>Estoque zerado.</div>
              )}
            </div>
            <button 
              onClick={() => setDetailSku(null)}
              style={{padding:'16px', background:'white', border:'none', borderTop:'1px solid #e2e8f0', cursor:'pointer', fontWeight:600, color:'#475569'}}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}