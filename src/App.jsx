import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// --- COMPONENTES ---
import FilterPanel from "./components/FilterPanel";
import ParamsPanel from "./components/ParamsPanel";
import KPICards from "./components/KPICards";
import ResultTable from "./components/ResultTable";
import TopLists from "./components/TopLists";
import QualityDashboard from "./components/QualityDashboard";
import LogisticsDashboard from "./components/LogisticsDashboard";
import PurchaseDashboard from "./components/PurchaseDashboard"; // <--- NOVO IMPORT

// --- ENGINE ---
import { loadCSV } from "./lib/csv";
import {
  buildProductMap,
  buildMatrizMap,
  buildLabSnapshotMap,
  normalizeMovRows,
  buildLabOptions,
  buildMonthOptions,
  computeFelipeTable,
  parseSkuInput,
  buildLojasMap,
  buildTecnicosMap,
  normalizeDefectRows
} from "./lib/engine";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState("analise"); // 'analise', 'qualidade', 'logistica', 'compras'
  const [theme, setTheme] = useState("light");

  // --- DADOS ---
  const [prodMap, setProdMap] = useState(new Map());
  const [matrizMap, setMatrizMap] = useState(new Map());
  const [labSnapMap, setLabSnapMap] = useState(new Map());
  const [movRows, setMovRows] = useState([]);
  
  const [lojasMap, setLojasMap] = useState(new Map());
  const [tecnicosMap, setTecnicosMap] = useState(new Map());
  const [defectRows, setDefectRows] = useState([]);

  // --- FILTROS ---
  const [monthOptions, setMonthOptions] = useState([]);
  const [labOptions, setLabOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("stock_filters");
      return saved ? JSON.parse(saved) : { mesInicio: "", mesFim: "", categorias: [], labs: [], skuText: "" };
    } catch {
      return { mesInicio: "", mesFim: "", categorias: [], labs: [], skuText: "" };
    }
  });

  const [kpiFilter, setKpiFilter] = useState(null);
  const [params, setParams] = useState({
    coberturaAlvoMeses: 3,
    transferenciaMinima: 2,
    regra6m: 6,
    regra12m: 12
  });

  useEffect(() => {
    localStorage.setItem("stock_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr("");
        const [prod, mov, estLab, estMatriz, defeitos, tecnicos, lojas] = await Promise.all([
          loadCSV("/data/stg_produto.csv"),
          loadCSV("/data/stg_lab_mov_mensal.csv"),
          loadCSV("/data/stg_estoque_lab.csv"),
          loadCSV("/data/stg_estoque_matriz.csv"),
          loadCSV("/data/stg_defeitos.csv"),
          loadCSV("/data/stg_tecnicos.csv"),
          loadCSV("/data/stg_lojas.csv")
        ]);

        const pMap = buildProductMap(prod);
        const movNorm = normalizeMovRows(mov);
        const lMap = buildLojasMap(lojas);
        
        setProdMap(pMap);
        setMatrizMap(buildMatrizMap(estMatriz));
        setLabSnapMap(buildLabSnapshotMap(estLab));
        setMovRows(movNorm);
        setLojasMap(lMap);
        setTecnicosMap(buildTecnicosMap(tecnicos));
        setDefectRows(normalizeDefectRows(defeitos, lMap));

        const months = buildMonthOptions(movNorm);
        setMonthOptions(months);
        setLabOptions(buildLabOptions(movNorm));
        setCategoryOptions(Array.from(new Set(Array.from(pMap.values()).map((x) => x.categoria))).sort());

        if (!filters.mesInicio) {
           setFilters(prev => ({ ...prev, mesInicio: months[0] || "", mesFim: months[months.length - 1] || "" }));
        }

        setLoading(false);
      } catch (e) { 
        console.error(e); 
        setErr("Erro ao carregar dados: " + String(e.message)); 
        setLoading(false); 
      }
    })();
  }, []);

  const computed = useMemo(() => {
    if (!movRows.length) return { rows: [] };
    const skuList = parseSkuInput(filters.skuText);
    return computeFelipeTable({ prodMap, matrizMap, labSnapMap, movRows, filters: { ...filters, skuList }, params });
  }, [prodMap, matrizMap, labSnapMap, movRows, filters, params]);

  const displayedRows = useMemo(() => {
    if (!kpiFilter) return computed.rows;
    return computed.rows.filter(r => {
       const st = String(r.Status || "").toLowerCase();
       if (kpiFilter === "critico") return r.CoberturaMeses < 1 && r.EstoqueAlvo > 0;
       if (kpiFilter === "sugerida") return r.ReposicaoSugeridaBruta > 0;
       if (kpiFilter === "devolucao") return r.DevolverSugerido > 0;
       if (kpiFilter === "semGiro6") return st.includes("6m");
       if (kpiFilter === "semGiro12") return st.includes("12m");
       return true;
    });
  }, [computed.rows, kpiFilter]);

  return (
    <div className="page" data-theme={theme}>
      <div className="appShell">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebarHeader"><div className="sidebarTitle">Produto x Tempo</div></div>
          <div className="navList">
            <button className={`navItem ${view==="analise"?"navItemActive":""}`} onClick={()=>setView("analise")}>
              📊 Análise Estoque
            </button>
            <button className={`navItem ${view==="qualidade"?"navItemActive":""}`} onClick={()=>setView("qualidade")}>
              🛡️ Qualidade
            </button>
            <button className={`navItem ${view==="logistica"?"navItemActive":""}`} onClick={()=>setView("logistica")}>
              🚚 Logística
            </button>
            <div className="my-2 border-t border-gray-700"></div> {/* Divisor */}
            <button className={`navItem ${view==="compras"?"navItemActive":""}`} onClick={()=>setView("compras")}>
              🏭 Compras Matriz
            </button>
          </div>
          <button className="themeToggle" onClick={()=>setTheme(t=>t==="light"?"dark":"light")}>
            {theme === "light" ? "🌙 Modo Escuro" : "☀️ Modo Claro"}
          </button>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <h1>
              {view === "analise" ? "Análise de Reposição (Labs)" : 
               view === "qualidade" ? "Gestão de Qualidade" : 
               view === "logistica" ? "Painel Logístico" : "Gestão de Compras (Matriz)"}
            </h1>
          </div>

          {!loading && !err && (
            <>
              {/* Filtros Globais (Apenas para Analise/Qualidade) */}
              {(view === "analise" || view === "qualidade") && (
                <div className="floatingWrap">
                  <div className="floatingPanel">
                    <FilterPanel monthOptions={monthOptions} labOptions={labOptions} categoryOptions={categoryOptions} filters={filters} setFilters={setFilters} />
                  </div>
                  {view === "analise" && (
                    <div className="floatingPanel"><ParamsPanel params={params} setParams={setParams} /></div>
                  )}
                </div>
              )}

              {/* TELAS */}
              {view === "analise" && (
                <>
                  <KPICards rows={computed.rows} activeFilter={kpiFilter} onCardClick={setKpiFilter} />
                  <ResultTable rows={displayedRows} />
                  <TopLists rows={displayedRows} /> 
                </>
              )}

              {view === "qualidade" && <QualityDashboard defects={defectRows} prodMap={prodMap} filters={filters} />}

              {view === "logistica" && <LogisticsDashboard lojasMap={lojasMap} stockRows={computed.rows} />}

              {/* NOVA TELA DE COMPRAS */}
              {view === "compras" && (
                <PurchaseDashboard 
                  prodMap={prodMap} 
                  matrizMap={matrizMap} 
                  labSnapMap={labSnapMap} 
                  movRows={movRows} 
                />
              )}
            </>
          )}
          
          {err && <div className="card error">{err}</div>}
        </main>
      </div>
    </div>
  );
}