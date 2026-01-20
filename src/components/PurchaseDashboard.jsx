import React, { useState, useMemo } from "react";

export default function PurchaseDashboard({ prodMap, matrizMap, labSnapMap, movRows }) {
  // --- ESTADOS DE CONTROLE (O "Painel de Comando") ---
  const [targetMonths, setTargetMonths] = useState(3); // Meta padrão: 3 meses
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [hideOk, setHideOk] = useState(false); // Esconder o que não precisa comprar

  // --- 1. PREPARAR DADOS DE CONSUMO (GIRO) ---
  const stats = useMemo(() => {
    // Descobre quantos meses de dados temos para fazer a média correta
    const uniqueMonths = new Set(movRows.map(r => r.Mes).filter(Boolean));
    const numMonths = uniqueMonths.size || 1; // Evita divisão por zero

    // Agrupa consumo por SKU (Soma de todos os labs)
    const consumptionBySku = new Map();
    movRows.forEach(row => {
      const sku = String(row.SKU);
      const qtd = (row.Vendas || 0) + (row.OutrasSaidas || 0); // Venda + Uso Interno/Garantia
      
      if (!consumptionBySku.has(sku)) consumptionBySku.set(sku, 0);
      consumptionBySku.set(sku, consumptionBySku.get(sku) + qtd);
    });

    return { consumptionBySku, numMonths };
  }, [movRows]);

  // --- 2. CÁLCULO MESTRE DE SUGESTÃO DE COMPRA ---
  const rows = useMemo(() => {
    const data = [];
    const categories = new Set();

    prodMap.forEach((prod, sku) => {
      categories.add(prod.categoria);

      // Filtros
      if (selectedCategory !== "Todas" && prod.categoria !== selectedCategory) return;
      if (searchTerm && !prod.descricao.toLowerCase().includes(searchTerm.toLowerCase()) && !sku.includes(searchTerm)) return;

      // A. Dados Básicos
      const totalConsumoPeriodo = stats.consumptionBySku.get(sku) || 0;
      const giroMensal = totalConsumoPeriodo / stats.numMonths; // Média mensal da rede

      // B. Estoque Global (Onde o produto está?)
      const estMatriz = matrizMap.get(sku) || 0;
      
      // Soma estoque de todos os laboratórios para este SKU
      let estLabs = 0;
      // Precisamos varrer o labSnapMap. Como a chave é "Lab__SKU", iteramos tudo (pode ser otimizado, mas para 5k itens é ok)
      // Uma forma mais rápida seria ter pré-processado isso, mas vamos iterar o map de labs
      // Nota: Para performance ideal em grandes bases, o 'engine' deveria entregar isso pronto. 
      // Aqui faremos um reduce rápido nas chaves que contém o SKU.
      // *Otimização*: Como não temos o map reverso aqui fácil, vamos assumir que o 'estMatriz' é o principal
      // e o estLabs vamos pegar aproximado ou iterar se for crítico.
      // DADO O CONTEXTO: Vamos iterar as chaves do labSnapMap que terminam com o SKU.
      for (const [key, qtd] of labSnapMap.entries()) {
        if (key.endsWith(`__${sku}`)) {
          estLabs += qtd;
        }
      }

      const estRede = estMatriz + estLabs;

      // C. A Fórmula Mágica
      // Cobertura = Quantos meses meu estoque atual dura?
      const coberturaMeses = giroMensal > 0 ? (estRede / giroMensal) : (estRede > 0 ? 999 : 0);
      
      // Sugestão = (Giro * Meta) - O que eu já tenho
      const metaEstoque = giroMensal * targetMonths;
      let sugestao = metaEstoque - estRede;
      
      // Regras de arredondamento e mínimo
      if (sugestao < 0) sugestao = 0;
      sugestao = Math.ceil(sugestao);

      // Status do Farol
      let status = "🟢 Saudável";
      let statusColor = "text-green-600 bg-green-100";
      
      if (estRede === 0 && giroMensal > 0) {
        status = "🔴 RUPTURA";
        statusColor = "text-white bg-red-600 font-bold";
      } else if (coberturaMeses < 1 && giroMensal > 0) {
        status = "🔴 Crítico (<1m)";
        statusColor = "text-red-600 bg-red-100 font-bold";
      } else if (coberturaMeses < targetMonths * 0.5) {
        status = "🟡 Atenção";
        statusColor = "text-orange-600 bg-orange-100";
      } else if (coberturaMeses > targetMonths * 2 && estRede > 10) {
        status = "🔵 Excesso";
        statusColor = "text-blue-600 bg-blue-100";
      }

      // Filtro de "Esconder OK"
      if (hideOk && sugestao <= 0) return;

      data.push({
        sku,
        descricao: prod.descricao,
        categoria: prod.categoria,
        giroMensal,
        estMatriz,
        estLabs,
        estRede,
        coberturaMeses,
        sugestao,
        status,
        statusColor
      });
    });

    // Ordenação Inteligente: Primeiro os que precisam comprar mais (Sugestão Descendente), depois por Giro
    return { 
      data: data.sort((a, b) => b.sugestao - a.sugestao || b.giroMensal - a.giroMensal), 
      categories: Array.from(categories).sort() 
    };
  }, [prodMap, matrizMap, labSnapMap, stats, targetMonths, selectedCategory, searchTerm, hideOk]);

  // Formata números
  const fmt = (n) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* --- PAINEL DE CONTROLE (O CÉREBRO) --- */}
      <div className="card p-5 bg-white shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gestão de Compras & Reposição (Matriz)</h2>
            <p className="text-sm text-slate-500 mt-1">
              Planejamento baseado na <strong>Demanda Agregada</strong> (Consumo de toda a rede) vs <strong>Estoque Global</strong>.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{rows.data.filter(r => r.sugestao > 0).length}</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Itens para Comprar</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Input de Cobertura */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meta de Cobertura (Meses)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={targetMonths} 
                onChange={(e) => setTargetMonths(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded font-bold text-blue-700"
                min="0.5" step="0.5"
              />
              <span className="text-xs text-slate-400 whitespace-nowrap">ex: 4 p/ China</span>
            </div>
          </div>

          {/* Filtro Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="Todas">Todas as Categorias</option>
              {rows.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Busca Texto */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buscar Produto</label>
            <input 
              type="text" 
              placeholder="SKU ou Nome..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Toggle Limpar */}
          <div className="pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={hideOk} 
                onChange={(e) => setHideOk(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded" 
              />
              <span className="text-sm text-slate-700">Mostrar apenas sugestões de compra</span>
            </label>
          </div>
        </div>
      </div>

      {/* --- TABELA DE RESULTADOS --- */}
      <div className="card overflow-hidden border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
              <tr>
                <th className="p-3 border-b">SKU / Produto</th>
                <th className="p-3 border-b text-center">Giro Mensal<br/><span className="text-[9px] font-normal text-slate-400">(Média Rede)</span></th>
                <th className="p-3 border-b text-center bg-blue-50/50">Estoque<br/>Matriz</th>
                <th className="p-3 border-b text-center">Estoque<br/>Filiais</th>
                <th className="p-3 border-b text-center font-bold">Total<br/>Rede</th>
                <th className="p-3 border-b text-center">Cobertura<br/><span className="text-[9px] font-normal text-slate-400">(Meses)</span></th>
                <th className="p-3 border-b text-center">Status</th>
                <th className="p-3 border-b text-right bg-yellow-50 text-yellow-800 border-l-4 border-l-yellow-400 w-32">SUGESTÃO<br/>COMPRA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.data.slice(0, 500).map((row) => (
                <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 max-w-xs">
                    <div className="font-bold text-slate-700">{row.descricao}</div>
                    <div className="flex gap-2 text-xs mt-1">
                      <span className="font-mono bg-slate-100 px-1 rounded text-slate-500">{row.sku}</span>
                      <span className="text-slate-400">{row.categoria}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center text-slate-600">{fmt(row.giroMensal)}</td>
                  <td className="p-3 text-center font-semibold text-blue-700 bg-blue-50/30">{row.estMatriz}</td>
                  <td className="p-3 text-center text-slate-500">{row.estLabs}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{row.estRede}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.coberturaMeses < 1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {fmt(row.coberturaMeses)} m
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs inline-block w-full ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-right bg-yellow-50 font-bold text-lg text-yellow-900 border-l-4 border-l-transparent">
                    {row.sugestao > 0 ? row.sugestao : "-"}
                  </td>
                </tr>
              ))}
              {rows.data.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Nenhum produto encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 text-xs text-center text-slate-400 border-t border-gray-200">
          Mostrando os top 500 itens prioritários
        </div>
      </div>
    </div>
  );
}