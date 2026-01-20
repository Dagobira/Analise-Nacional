import React, { useState, useMemo } from "react";

// --- ESTILOS CSS V6 (COM FILTRO DE STATUS NO HEADER) ---
const styles = `
  /* GERAL: Ocupa 100% da altura e não deixa a página principal rolar */
  .pd-container {
    display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1e293b; 
    height: 100%; 
    overflow: hidden;
  }

  /* SEÇÃO FIXA (CABEÇALHO + FILTROS) */
  .pd-fixed-section {
    flex: 0 0 auto; /* Não encolhe */
    display: flex; flex-direction: column; 
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    z-index: 20; /* Fica acima da tabela */
  }
  
  .pd-header {
    padding: 16px 24px; border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .pd-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
  .pd-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
  
  .btn-export {
    background: #10b981; color: white; border: none; padding: 8px 16px;
    border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 8px; transition: background 0.2s;
  }
  .btn-export:hover { background: #059669; }

  /* KPI */
  .pd-kpi-box { text-align: right; }
  .pd-kpi-val { font-size: 24px; font-weight: 800; color: #2563eb; line-height: 1; }
  .pd-kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }

  /* FILTROS (GRID DE 5 COLUNAS AGORA) */
  .pd-filters {
    padding: 16px 24px; background: #f8fafc;
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; align-items: end;
    border-radius: 0 0 8px 8px;
  }
  .pd-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; display: block; }
  
  .pd-input, .pd-select {
    width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;
    font-size: 13px; outline: none; box-sizing: border-box; background: white;
    height: 36px; /* Altura fixa para alinhar */
  }
  .pd-input:focus, .pd-select:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }

  /* ÁREA DE SCROLL (TABELA) */
  .pd-scroll-wrapper {
    flex: 1; /* Ocupa o resto da tela */
    overflow: hidden; 
    border-radius: 8px; border: 1px solid #e2e8f0; background: white;
    display: flex; flex-direction: column;
  }
  .pd-table-scroll { 
    flex: 1; overflow-y: auto; position: relative;
  }

  .pd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .pd-table th {
    background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px;
    padding: 12px 20px; text-align: left; 
    position: sticky; top: 0; z-index: 10;
    box-shadow: 0 2px 2px -1px rgba(0,0,0,0.1);
  }
  .pd-table td { padding: 10px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
  .pd-table tr { cursor: pointer; transition: background 0.1s; }
  .pd-table tr:hover { background: #f1f5f9; }
  
  .col-center { text-align: center; }
  .col-right { text-align: right; }
  
  /* BADGES */
  .badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
  .badge-crit { background: #fee2e2; color: #991b1b; }
  .badge-warn { background: #ffedd5; color: #9a3412; }
  .badge-ok { background: #dcfce7; color: #166534; }
  .badge-over { background: #dbeafe; color: #1e40af; }

  .sug-cell { 
    background: #fefce8; color: #854d0e; font-weight: 800; font-size: 14px; 
    border-left: 4px solid #facc15;
  }

  /* MODAL */
  .detail-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px);
  }
  .detail-card {
    background: white; width: 450px; max-width: 90%;
    border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    overflow: hidden; display: flex; flex-direction: column;
  }
  .detail-header { background: #1e293b; color: white; padding: 20px; }
  .detail-body { padding: 0; max-height: 50vh; overflow-y: auto; }
  .lab-row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .lab-name { font-weight: 500; color: #334155; }
  .lab-qty { font-weight: 700; color: #0f172a; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(-5px);} to { opacity:1; transform:translateY(0);} }
`;

export default function PurchaseDashboard({ prodMap, matrizMap, labSnapMap, movRows }) {
  // --- STATES ---
  const [targetMonths, setTargetMonths] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [hideOk, setHideOk] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Todas"); // NOVO: Dropdown de Status
  const [detailSku, setDetailSku] = useState(null);

  // 1. INDEXAÇÃO (Otimização)
  const stockIndex = useMemo(() => {
    const index = new Map();
    for (const [key, qtd] of labSnapMap.entries()) {
      if (qtd > 0) {
        const separatorIndex = key.lastIndexOf("__");
        if (separatorIndex !== -1) {
          const labName = key.substring(0, separatorIndex);
          const sku = key.substring(separatorIndex + 2);
          if (!index.has(sku)) index.set(sku, { total: 0, breakdown: [] });
          const entry = index.get(sku);
          entry.total += qtd;
          entry.breakdown.push({ lab: labName, qtd });
        }
      }
    }
    return index;
  }, [labSnapMap]);

  // 2. DADOS DE CONSUMO
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

  // 3. CÁLCULO
  const rows = useMemo(() => {
    const data = [];
    const categories = new Set();
    
    prodMap.forEach((prod, sku) => {
      categories.add(prod.categoria);
      
      // Filtros básicos
      if (selectedCategory !== "Todas" && prod.categoria !== selectedCategory) return;
      if (searchTerm && !prod.descricao.toLowerCase().includes(searchTerm.toLowerCase()) && !sku.includes(searchTerm)) return;

      const totalConsumoPeriodo = stats.consumptionBySku.get(sku) || 0;
      const giroMensal = totalConsumoPeriodo / stats.numMonths;
      const estMatriz = matrizMap.get(sku) || 0;
      
      const stockData = stockIndex.get(sku) || { total: 0, breakdown: [] };
      const estLabs = stockData.total;
      const breakdown = stockData.breakdown;
      
      const estRede = estMatriz + estLabs;
      const coberturaMeses = giroMensal > 0 ? (estRede / giroMensal) : (estRede > 0 ? 999 : 0);
      const metaEstoque = giroMensal * targetMonths;
      let sugestao = metaEstoque - estRede;
      if (sugestao < 0) sugestao = 0;
      sugestao = Math.ceil(sugestao);

      // Status Lógico
      let statusLabel = "Ok"; let statusClass = "badge-ok";
      if (estRede === 0 && giroMensal > 0) { statusLabel = "RUPTURA"; statusClass = "badge-crit"; }
      else if (coberturaMeses < 1 && giroMensal > 0) { statusLabel = "Crítico"; statusClass = "badge-crit"; }
      else if (coberturaMeses < targetMonths * 0.5) { statusLabel = "Atenção"; statusClass = "badge-warn"; }
      else if (coberturaMeses > targetMonths * 2 && estRede > 10) { statusLabel = "Excesso"; statusClass = "badge-over"; }

      // --- FILTRO DE STATUS (DROPDOWN) ---
      if (statusFilter !== "Todas") {
        // Mapeamento visual para lógico se necessário, mas aqui usaremos match direto ou aproximado
        // "Ok" no sistema é "Saudável" na UI? Vamos padronizar
        if (statusFilter === "Saudável" && statusLabel !== "Ok") return;
        if (statusFilter !== "Saudável" && statusLabel !== statusFilter) return;
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
  }, [prodMap, matrizMap, stockIndex, stats, targetMonths, selectedCategory, searchTerm, hideOk, statusFilter]);

  const fmt = (n) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
  
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SKU;Produto;Categoria;Giro Mensal;Estoque Matriz;Estoque Filiais;Total Rede;Cobertura (Meses);Sugestao Compra;Status\n";
    rows.data.forEach(r => {
      const line = `${r.sku};"${r.descricao}";${r.categoria};${fmt(r.giroMensal)};${r.estMatriz};${r.estLabs};${r.estRede};${fmt(r.coberturaMeses)};${r.sugestao};${r.statusLabel}`;
      csvContent += line + "\n";
    });
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "compras.csv"); document.body.appendChild(link); link.click();
  };

  const selectedItem = detailSku ? rows.data.find(r => r.sku === detailSku) : null;

  return (
    <>
      <style>{styles}</style>
      <div className="pd-container">
        
        {/* SEÇÃO FIXA (NOVO LAYOUT) */}
        <div className="pd-fixed-section">
          <div className="pd-header">
            <div>
              <h2 className="pd-title">Central de Compras & Reposição</h2>
              <p className="pd-subtitle">Planejamento: Demanda Rede vs Estoque Global</p>
            </div>
            <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
              <div className="pd-kpi-box"><div className="pd-kpi-val">{rows.data.filter(r => r.sugestao > 0).length}</div><div className="pd-kpi-label">Itens p/ Pedir</div></div>
              <button className="btn-export" onClick={handleExport}>📥 Exportar CSV</button>
            </div>
          </div>

          <div className="pd-filters">
            {/* Meta */}
            <div className="pd-input-group">
              <label className="pd-label">Meta Cobertura (Meses)</label>
              <input type="number" className="pd-input" value={targetMonths} onChange={e=>setTargetMonths(Number(e.target.value))} step="0.5" />
            </div>
            
            {/* Categoria */}
            <div className="pd-input-group">
              <label className="pd-label">Filtrar Categoria</label>
              <select className="pd-select" value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}>
                <option value="Todas">Todas</option>
                {rows.categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* NOVO: STATUS */}
            <div className="pd-input-group">
              <label className="pd-label">Filtrar Status</label>
              <select className="pd-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{fontWeight: statusFilter!=='Todas'?'bold':'normal', color: statusFilter!=='Todas'?'#2563eb':'inherit'}}>
                <option value="Todas">Todos os Status</option>
                <option value="RUPTURA">🔴 RUPTURA (Falta)</option>
                <option value="Crítico">🟠 Crítico (&lt;1 mês)</option>
                <option value="Atenção">🟡 Atenção</option>
                <option value="Saudável">🟢 Saudável</option>
                <option value="Excesso">🔵 Excesso</option>
              </select>
            </div>

            {/* Busca */}
            <div className="pd-input-group">
              <label className="pd-label">Buscar Produto</label>
              <input type="text" className="pd-input" placeholder="SKU ou Nome..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            </div>

            {/* Checkbox */}
            <div className="pd-input-group" style={{justifyContent:'center'}}>
              <label style={{fontSize:'12px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontWeight:500, height:'36px'}}>
                <input type="checkbox" checked={hideOk} onChange={e=>setHideOk(e.target.checked)} /> Mostrar só Sugestões
              </label>
            </div>
          </div>
        </div>

        {/* ÁREA DE SCROLL (TABELA) */}
        <div className="pd-scroll-wrapper">
          <div className="pd-table-scroll">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Produto / SKU</th>
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
                  <tr key={row.sku} onClick={() => setDetailSku(row.sku)} title="Clique para detalhes">
                    <td><div style={{fontWeight:600}}>{row.descricao}</div><div style={{fontSize:'11px', color:'#64748b'}}>{row.sku} • {row.categoria}</div></td>
                    <td className="col-center">{fmt(row.giroMensal)}</td>
                    <td className="col-center" style={{fontWeight:600, color:'#2563eb', background:'#eff6ff', borderRadius:'4px'}}>{row.estMatriz}</td>
                    <td className="col-center" style={{color:'#64748b'}}>{row.estLabs}</td>
                    <td className="col-center" style={{fontWeight:700}}>{row.estRede}</td>
                    <td className="col-center">{fmt(row.coberturaMeses)}</td>
                    <td className="col-center"><span className={`badge ${row.statusClass}`}>{row.statusLabel}</span></td>
                    <td className={`col-right ${row.sugestao > 0 ? 'sug-cell' : ''}`}>{row.sugestao > 0 ? row.sugestao : '-'}</td>
                  </tr>
                ))}
                {rows.data.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Nenhum resultado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedItem && (
        <div className="detail-overlay" onClick={() => setDetailSku(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <div className="detail-header"><h3 style={{margin:0, fontSize:'16px'}}>Detalhes do Estoque</h3><div style={{fontSize:'12px', opacity:0.8}}>{selectedItem.descricao}</div></div>
            <div className="detail-body">
              <div className="lab-row" style={{background:'#f8fafc', fontWeight:600}}><span className="lab-name">📦 Estoque Matriz</span><span className="lab-qty" style={{color:'#2563eb'}}>{selectedItem.estMatriz}</span></div>
              {selectedItem.breakdown.sort((a,b) => b.qtd - a.qtd).map((item, idx) => (
                <div key={idx} className="lab-row"><span className="lab-name">{item.lab}</span><span className="lab-qty">{item.qtd}</span></div>
              ))}
              {selectedItem.breakdown.length === 0 && selectedItem.estMatriz === 0 && <div style={{padding:'30px', textAlign:'center', color:'#cbd5e1'}}>Estoque zerado na rede.</div>}
            </div>
            <button onClick={() => setDetailSku(null)} style={{padding:'15px', background:'white', border:'none', borderTop:'1px solid #e2e8f0', cursor:'pointer', fontWeight:600, color:'#475569'}}>Fechar Detalhes</button>
          </div>
        </div>
      )}
    </>
  );
}