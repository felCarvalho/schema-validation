export enum CodigoStatus {
    CONTINUE = 100,
    TROCA_DE_PROTOCOLO = 101,
    PROCESSANDO = 102,
    DICAS_ANTECIPADAS = 103,
    SUCESSO = 200,
    CRIADO = 201,
    ACEITO = 202,
    INFORMACAO_NAO_AUTORITATIVA = 203,
    SEM_CONTEUDO = 204,
    REDEFINIR_CONTEUDO = 205,
    CONTEUDO_PARCIAL = 206,
    MULTI_STATUS = 207,
    JA_REPORTADO = 208,
    IM_USADO = 226,
    MULTIPLAS_OPCOES = 300,
    MOVIDO_PERMANENTEMENTE = 301,
    REDIRECIONADO = 302,
    VER_OUTRO = 303,
    NAO_MODIFICADO = 304,
    USAR_PROXY = 305,
    REDIRECIONAMENTO_TEMPORARIO = 307,
    REDIRECIONAMENTO_PERMANENTE = 308,
    REQUISICAO_INVALIDA = 400,
    NAO_AUTENTICADO = 401,
    PAGAMENTO_NECESSARIO = 402,
    ACESSO_NEGADO = 403,
    RECURSO_NAO_ENCONTRADO = 404,
    METODO_NAO_PERMITIDO = 405,
    NAO_ACEITAVEL = 406,
    AUTENTICACAO_PROXY_NECESSARIA = 407,
    TEMPO_ESGOTADO = 408,
    CONFLITO = 409,
    RECURSO_REMOVIDO = 410,
    TAMANHO_NECESSARIO = 411,
    PRE_CONDICAO_FALHOU = 412,
    CORPO_MUITOS_GRANDE = 413,
    URI_MUITOS_LONGA = 414,
    TIPO_MIDIA_NAO_SUPORTADO = 415,
    RANGE_INVALIDO = 416,
    EXPECTATIVA_FALHOU = 417,
    SOU_UMA_PANECA = 418,
    REQUISICAO_MAL_DIRECIONADA = 421,
    ENTIDADE_INPROCESSAVEL = 422,
    RECURSO_BLOQUEADO = 423,
    DEPENDENCIA_FALHOU = 424,
    MUITO_CEDO = 425,
    ATUALIZACAO_NECESSARIA = 426,
    PRE_CONDICAO_NECESSARIA = 428,
    MUITAS_REQUISICOES = 429,
    CABECALHOS_MUITOS_GRANDES = 431,
    INDISPONIVEL_POR_MOTIVOS_LEGAIS = 451,
    ERRO_INTERNO_SERVIDOR = 500,
    NAO_IMPLEMENTADO = 501,
    GATEWAY_INVALIDO = 502,
    SERVICO_INDISPONIVEL = 503,
    TEMPO_GATEWAY_ESGOTADO = 504,
    VERSAO_HTTP_NAO_SUPORTADA = 505,
    VARIANTE_TAMBEM_NEGOCIA = 506,
    ARMAZENAMENTO_INSUFICIENTE = 507,
    LOOP_DETECTADO = 508,
    NAO_EXTENDIDO = 510,
    AUTENTICACAO_REDE_NECESSARIA = 511,
}

export const DescricaoStatus: Record<CodigoStatus, string> = {
    [CodigoStatus.CONTINUE]:
        "O servidor recebeu os cabeçalhos da requisição e o cliente deve continuar a enviar o corpo.",
    [CodigoStatus.TROCA_DE_PROTOCOLO]:
        "O servidor está trocando para o protocolo solicitado pelo cliente.",
    [CodigoStatus.PROCESSANDO]:
        "O servidor está processando a requisição e ainda não enviou uma resposta final.",
    [CodigoStatus.DICAS_ANTECIPADAS]:
        "O servidor está enviando dicas sobre a resposta antes de processar completamente.",
    [CodigoStatus.SUCESSO]: "A requisição foi processada com sucesso.",
    [CodigoStatus.CRIADO]: "Um novo recurso foi criado com sucesso.",
    [CodigoStatus.ACEITO]: "A requisição foi aceita para processamento.",
    [CodigoStatus.INFORMACAO_NAO_AUTORITATIVA]:
        "A resposta contém informações de uma fonte alternativa ou em cache.",
    [CodigoStatus.SEM_CONTEUDO]:
        "A requisição foi processada, mas não há conteúdo para retornar.",
    [CodigoStatus.REDEFINIR_CONTEUDO]:
        "O cliente deve redefinir a visualização do formulário.",
    [CodigoStatus.CONTEUDO_PARCIAL]:
        "O servidor retornou apenas uma parte do recurso solicitado.",
    [CodigoStatus.MULTI_STATUS]:
        "O servidor retornou múltiplos códigos de status para operações combinadas.",
    [CodigoStatus.JA_REPORTADO]:
        "A informações já foi retornada anteriormente nesta requisição.",
    [CodigoStatus.IM_USADO]:
        "O servidor já processou a requisição e não há nada novo para retornar.",
    [CodigoStatus.MULTIPLAS_OPCOES]:
        "O recurso solicitado possui múltiplas representações disponíveis.",
    [CodigoStatus.MOVIDO_PERMANENTEMENTE]:
        "O recurso foi movido permanentemente para uma nova URL.",
    [CodigoStatus.REDIRECIONADO]:
        "O recurso foi movido temporariamente para outra URL.",
    [CodigoStatus.VER_OUTRO]:
        "O recurso requerido está disponível em uma URL diferente.",
    [CodigoStatus.NAO_MODIFICADO]:
        "O recurso não foi modificado desde a última requisição.",
    [CodigoStatus.USAR_PROXY]:
        "O acesso ao recurso deve ser feito através do proxy especificado.",
    [CodigoStatus.REDIRECIONAMENTO_TEMPORARIO]:
        "O recurso está temporariamente disponível em outra URL.",
    [CodigoStatus.REDIRECIONAMENTO_PERMANENTE]:
        "O recurso foi realocado permanentemente para uma nova URL.",
    [CodigoStatus.REQUISICAO_INVALIDA]:
        "A sintaxe da requisição está inválida ou malformada.",
    [CodigoStatus.NAO_AUTENTICADO]:
        "A requisição requiere autenticação válida.",
    [CodigoStatus.PAGAMENTO_NECESSARIO]:
        "O acesso ao recurso requer pagamento.",
    [CodigoStatus.ACESSO_NEGADO]:
        "Você não tem permissão para acessar este recurso.",
    [CodigoStatus.RECURSO_NAO_ENCONTRADO]:
        "O recurso solicitado não foi encontrado no servidor.",
    [CodigoStatus.METODO_NAO_PERMITIDO]:
        "O método HTTP usado não é permitido para este recurso.",
    [CodigoStatus.NAO_ACEITAVEL]:
        "Os parâmetros enviados não são aceitáveis para processar a requisição.",
    [CodigoStatus.AUTENTICACAO_PROXY_NECESSARIA]:
        "É necessário autenticar-se com o proxy para continuar.",
    [CodigoStatus.TEMPO_ESGOTADO]:
        "O servidor esgotou o tempo de espera pela requisição.",
    [CodigoStatus.CONFLITO]:
        "A requisição conflitou com o estado atual do recurso.",
    [CodigoStatus.RECURSO_REMOVIDO]:
        "O recurso solicitado foi removido e não está mais disponível.",
    [CodigoStatus.TAMANHO_NECESSARIO]:
        "O cabeçalho Content-Length é obrigatório nesta requisição.",
    [CodigoStatus.PRE_CONDICAO_FALHOU]:
        "As condições enviadas não foram atendidas pelo servidor.",
    [CodigoStatus.CORPO_MUITOS_GRANDE]:
        "O corpo da requisição excede o limite aceito pelo servidor.",
    [CodigoStatus.URI_MUITOS_LONGA]:
        "A URI da requisição é longa demais para ser processada.",
    [CodigoStatus.TIPO_MIDIA_NAO_SUPORTADO]:
        "O tipo de mídia da requisição não é suportado pelo servidor.",
    [CodigoStatus.RANGE_INVALIDO]:
        "O intervalo de bytes solicitado não pôde ser atendito.",
    [CodigoStatus.EXPECTATIVA_FALHOU]:
        "O servidor não pôde atender a expectativa informada no cabeçalho.",
    [CodigoStatus.SOU_UMA_PANECA]:
        "O servidor recusa preparar café em uma cafeteira eléctrica.",
    [CodigoStatus.REQUISICAO_MAL_DIRECIONADA]:
        "A requisição foi enviada para um servidor que não consegue processá-la.",
    [CodigoStatus.ENTIDADE_INPROCESSAVEL]:
        "O formato da requisição está correto, mas não pôde ser processado.",
    [CodigoStatus.RECURSO_BLOQUEADO]:
        "O recurso está bloqueado e não pode ser modificado.",
    [CodigoStatus.DEPENDENCIA_FALHOU]:
        "A requisição falhou porque dependia de outra requisição que falhou.",
    [CodigoStatus.MUITO_CEDO]:
        "O servidor não está pronto para processar a requisição.",
    [CodigoStatus.ATUALIZACAO_NECESSARIA]:
        "O cliente precisa atualizar o protocolo para continuar.",
    [CodigoStatus.PRE_CONDICAO_NECESSARIA]:
        "O cabeçalho de pré-condição é obrigatório.",
    [CodigoStatus.MUITAS_REQUISICOES]:
        "Muitas requisições foram enviadas em pouco tempo. Tente novamente mais tarde.",
    [CodigoStatus.CABECALHOS_MUITOS_GRANDES]:
        "Os cabeçalhos da requisição são grandes demais para processar.",
    [CodigoStatus.INDISPONIVEL_POR_MOTIVOS_LEGAIS]:
        "O recurso foi removido por motivos legais.",
    [CodigoStatus.ERRO_INTERNO_SERVIDOR]:
        "Ocorreu um erro inesperado no servidor ao processar a requisição.",
    [CodigoStatus.NAO_IMPLEMENTADO]:
        "A funcionalidade solicitada ainda não foi implementada.",
    [CodigoStatus.GATEWAY_INVALIDO]:
        "O servidor gateway recebeu uma resposta inválida de outro servidor.",
    [CodigoStatus.SERVICO_INDISPONIVEL]:
        "O serviço está temporariamente indisponível. Tente novamente mais tarde.",
    [CodigoStatus.TEMPO_GATEWAY_ESGOTADO]:
        "O servidor gateway não recebeu resposta a tempo do servidor upstream.",
    [CodigoStatus.VERSAO_HTTP_NAO_SUPORTADA]:
        "A versão do protocolo HTTP usada não é suportada.",
    [CodigoStatus.VARIANTE_TAMBEM_NEGOCIA]:
        "O servidor detectou um erro interno de negociação de conteúdo.",
    [CodigoStatus.ARMAZENAMENTO_INSUFICIENTE]:
        "O servidor não tem espaço suficiente para completar a requisição.",
    [CodigoStatus.LOOP_DETECTADO]:
        "O servidor detectou um loop infinito ao processar a requisição.",
    [CodigoStatus.NAO_EXTENDIDO]:
        "São necessárias mais extensões para processar a requisição.",
    [CodigoStatus.AUTENTICACAO_REDE_NECESSARIA]:
        "É necessário autenticar-se para acessar a rede.",
};
