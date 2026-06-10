export type Regiao =
  | "Metropolitana"
  | "Baixada Fluminense"
  | "Região dos Lagos"
  | "Norte Fluminense"
  | "Noroeste Fluminense"
  | "Serrana"
  | "Médio Paraíba"
  | "Costa Verde"
  | "Centro-Sul";

export interface Municipio {
  id: string;
  nome: string;
  regiao: Regiao;
  eleitorado: number;
  metaVotos: number;
  votosProjetados: number;
  lideres: number;
  /** Votos reais do candidato neste município na eleição estadual de 2022 (TSE). */
  votos2022?: number;
}

export type TipoApoiador = "Liderança" | "Cabo eleitoral" | "Voluntário" | "Doador";
export type StatusApoiador = "Ativo" | "Potencial" | "Inativo";

export interface Apoiador {
  id: string;
  nome: string;
  tipo: TipoApoiador;
  municipio: string;
  regiao: Regiao;
  telefone: string;
  metaVotos: number;
  votosEstimados: number;
  status: StatusApoiador;
  responsavel: string;
  ultimoContato: string;
}

export type TipoEvento =
  | "Comício"
  | "Reunião"
  | "Caminhada"
  | "Carreata"
  | "Entrevista"
  | "Visita"
  | "Live";
export type StatusEvento = "Confirmado" | "Agendado" | "Realizado" | "Cancelado";

export interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  inicio: string;
  municipio: string;
  local: string;
  status: StatusEvento;
  publicoEstimado: number;
  responsavel: string;
}

export type TipoReceita =
  | "Pessoa física"
  | "Fundo partidário"
  | "Recurso próprio"
  | "Financiamento coletivo";

export interface Receita {
  id: string;
  data: string;
  origem: string;
  tipo: TipoReceita;
  valor: number;
}

export type CategoriaDespesa =
  | "Material de campanha"
  | "Marketing digital"
  | "Pessoal"
  | "Combustível"
  | "Eventos"
  | "Aluguel"
  | "Outros";
export type StatusDespesa = "Pago" | "Pendente";

export interface Despesa {
  id: string;
  data: string;
  descricao: string;
  categoria: CategoriaDespesa;
  fornecedor: string;
  valor: number;
  status: StatusDespesa;
}

export interface Campanha {
  candidato: string;
  cargo: string;
  partido: string;
  numero: string;
  estado: string;
  dataEleicao: string;
  metaVotos: number;
  limiteGastoTSE: number;
}
