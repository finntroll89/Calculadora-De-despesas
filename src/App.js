import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trash2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
const CATEGORIAS = [
  { id: 'moradia', nome: 'Moradia', cor: '#FF6B6B' },
  { id: 'transporte', nome: 'Transporte', cor: '#4ECDC4' },
  { id: 'alimentacao', nome: 'Alimentação', cor: '#45B7D1' },
  { id: 'lazer', nome: 'Lazer', cor: '#96CEB4' },
  { id: 'outros', nome: 'Outros', cor: '#D4A5A5' }
];

const gerarRelatorioPDF = () => {
  const pdf = new jsPDF();
  // Resto do código
};

const CalculadoraDespesas = () => {
  const [salario, setSalario] = useState('0');
  const [despesas, setDespesas] = useState([]);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('despesasData');
    if (dadosSalvos) {
      const { salario: salarioSalvo, despesas: despesasSalvas } = JSON.parse(dadosSalvos);
      setSalario(salarioSalvo);
      setDespesas(despesasSalvas);
    } else {
      setDespesas([{ id: Date.now(), nome: '', valor: '0', categoria: 'outros' }]);
    }
  }, []);

  const formatarMoeda = (valor) => {
    const num = typeof valor === 'string' ? parseFloat(valor.replace(/\D/g, '')) / 100 : valor;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num || 0);
  };

  const converterParaNumero = (valor) => {
    if (typeof valor === 'number') return valor;
    const numero = parseFloat(valor.replace(/\D/g, '')) / 100;
    return numero > 1000000000 ? 1000000000 : numero || 0;
  };

  const adicionarDespesa = () => {
    if (despesas.length >= 100) {
      alert('Limite de 100 despesas atingido.');
      return;
    }
    setDespesas([...despesas, { id: Date.now(), nome: '', valor: '0', categoria: 'outros' }]);
  };

  const removerDespesa = (id) => {
    setDespesas(despesas.filter(d => d.id !== id));
  };

  const atualizarDespesa = (id, campo, valor) => {
    setDespesas(despesas.map(d => {
      if (d.id === id) {
        if (campo === 'valor') {
          const numeroValor = parseFloat(valor.replace(/[^\d,]+/g, '').replace(',', '.'));
          return { ...d, [campo]: numeroValor > 1000000000 ? '1000000000' : numeroValor.toString() };
        } else {
          return { ...d, [campo]: valor.slice(0, 50) };
        }
      }
      return d;
    }));
  };

  const calcularTotais = () => {
    const totalDespesas = despesas.reduce((acc, d) => acc + converterParaNumero(d.valor), 0);
    const saldoFinal = converterParaNumero(salario) - totalDespesas;
    return { totalDespesas, saldoFinal };
  };

  const limparDados = () => {
    localStorage.removeItem('despesasData');
    setSalario('0');
    setDespesas([{ id: Date.now(), nome: '', valor: '0', categoria: 'outros' }]);
    alert('Dados limpos com sucesso!');
  };

  const gerarRelatorioPDF = () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const { totalDespesas, saldoFinal } = calcularTotais();

    pdf.setFont("helvetica");
    pdf.setFontSize(16);
    pdf.text("Relatório de Despesas", 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    pdf.text(`Salário: ${formatarMoeda(converterParaNumero(salario))}`, 20, 40);
    
    pdf.text("Despesas:", 20, 55);
    let y = 65;
    
    despesas.forEach((despesa, index) => {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      const categoria = CATEGORIAS.find(c => c.id === despesa.categoria)?.nome;
      const linha = `${index + 1}. ${despesa.nome} (${categoria}): ${formatarMoeda(converterParaNumero(despesa.valor))}`;
      pdf.text(linha, 20, y);
      y += 10;
    });
    
    y += 10;
    pdf.text(`Total de Despesas: ${formatarMoeda(totalDespesas)}`, 20, y);
    y += 10;
    pdf.text(`Saldo Final: ${formatarMoeda(saldoFinal)}`, 20, y);
    
    pdf.setFontSize(10);
    pdf.text("Calculadora de Despesas - Desenvolvido por Dev. Alex Paz", 20, 280);
    
    pdf.save("relatorio-despesas.pdf");
  };

  const gerarRelatorioDoc = () => {
    const { totalDespesas, saldoFinal } = calcularTotais();
    
    let conteudo = "RELATÓRIO DE DESPESAS\n\n";
    conteudo += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    conteudo += `Salário: ${formatarMoeda(converterParaNumero(salario))}\n\n`;
    
    conteudo += "DESPESAS:\n";
    despesas.forEach((despesa, index) => {
      const categoria = CATEGORIAS.find(c => c.id === despesa.categoria)?.nome;
      conteudo += `${index + 1}. ${despesa.nome} (${categoria}): ${formatarMoeda(converterParaNumero(despesa.valor))}\n`;
    });
    
    conteudo += `\nTotal de Despesas: ${formatarMoeda(totalDespesas)}`;
    conteudo += `\nSaldo Final: ${formatarMoeda(saldoFinal)}`;
    
    conteudo += "\n\nCalculadora de Despesas - Desenvolvido por Dev. Alex Paz";
    
    const blob = new Blob([conteudo], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio-despesas.doc";
    link.click();
  };

  const prepararDadosGrafico = () => {
    return CATEGORIAS.map(categoria => ({
      nome: categoria.nome,
      valor: despesas
        .filter(d => d.categoria === categoria.id)
        .reduce((acc, d) => acc + converterParaNumero(d.valor), 0),
      cor: categoria.cor
    })).filter(d => d.valor > 0);
  };

  const { totalDespesas, saldoFinal } = calcularTotais();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Calculadora de Despesas</h1>
        
        <div className="space-y-4">
        <div> 
          <label className="block text-sm font-medium mb-1">Salário</label>
          <input
              type="text"
              className="w-full border rounded p-2"
              value={formatarMoeda(salario)}
              onChange={(e) => setSalario(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>

          {despesas.map((despesa) => (
  <div key={despesa.id} className="flex gap-2">
    <input
  type="text"
  className="flex-1 border rounded p-2"
  value={despesa.nome}
  onChange={(e) => atualizarDespesa(despesa.id, 'nome', e.target.value)}
  placeholder="Nome da despesa"
/>
    <input
      type="text"
      className="w-32 border rounded p-2"
      value={formatarMoeda(despesa.valor)}
      onChange={(e) => atualizarDespesa(despesa.id, 'valor', e.target.value.replace(/\D/g, '').slice(0, 10))}
    />
    <select
      className="border rounded p-2"
      value={despesa.categoria}
      onChange={(e) => atualizarDespesa(despesa.id, 'categoria', e.target.value)}
    >
      {CATEGORIAS.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.nome}</option>
      ))}
    </select>
    <button
      onClick={() => removerDespesa(despesa.id)}
      className="p-2 text-red-500"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
))}

          <button
            onClick={adicionarDespesa}
            className="w-full p-2 bg-blue-500 text-white rounded flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Adicionar Despesa
          </button>

          <div className="p-4 bg-gray-50 rounded">
            <div className="text-lg">
              Total de Despesas: <span className="font-bold">{formatarMoeda(totalDespesas)}</span>
            </div>
            <div className={saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}>
              Saldo Final: <span className="font-bold">{formatarMoeda(saldoFinal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
           onClick={limparDados}
           className="p-2 bg-red-500 text-white rounded"
          >
            Limpar Dados
          </button>
            <button
              onClick={gerarRelatorioPDF}
              className="p-2 bg-red-500 text-white rounded"
            >
              Gerar PDF
            </button>
            <button
              onClick={gerarRelatorioDoc}
              className="p-2 bg-blue-600 text-white rounded"
            >
              Gerar DOC
            </button>
            <button
              onClick={() => setMostrarGrafico(!mostrarGrafico)}
              className="p-2 bg-orange-500 text-white rounded"
            >
              {mostrarGrafico ? 'Ocultar' : 'Ver'} Gráfico
            </button>
          </div>

          {mostrarGrafico && despesas.some(d => converterParaNumero(d.valor) > 0) && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepararDadosGrafico()}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ nome, value }) => `${nome}: ${formatarMoeda(value)}`}
                  >
                    {prepararDadosGrafico().map((entry, index) => (
                      <Cell key={index} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatarMoeda(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-sm text-gray-500 mt-8">
        Calculadora de Despesas - Desenvolvido por Dev. Alex Paz
      </footer>
    </div>
  );
};

export default CalculadoraDespesas;