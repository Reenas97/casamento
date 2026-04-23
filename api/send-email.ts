export default async function handler(req: any, res: any) {
  // ✅ CORS (resolve 405/OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      nomes_do_grupo,
      grupo,
      data_confirmacao,
      email_convidado,
      nome,
      data_evento,
      enviarEmailConvidado
    } = req.body;

    // 📩 Email para noivos
    const responseNoivos = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: "service_15m06v9",
        template_id: "template_gvlgpk8",
        public_key: "vMbgZBpGnITp0wp_m", // ⚠️ troca aqui
        template_params: {
          nomes_do_grupo,
          grupo,
          data_confirmacao,
          email_convidado,
        },
      }),
    });

    const textNoivos = await responseNoivos.text();

    if (!responseNoivos.ok) {
      console.error("Erro EmailJS (noivos):", textNoivos);
      return res.status(500).json({ error: textNoivos });
    }

    // 📩 Email para convidado (se confirmou)
    if (enviarEmailConvidado) {
      const responseConvidado = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: "service_15m06v9",
          template_id: "template_gs1ecx4",
          public_key: "vMbgZBpGnITp0wp_m", // ⚠️ troca aqui
          template_params: {
            nome,
            nomes_do_grupo,
            data_evento,
            data_confirmacao,
            email_convidado,
          },
        }),
      });

      const textConvidado = await responseConvidado.text();

      if (!responseConvidado.ok) {
        console.error("Erro EmailJS (convidado):", textConvidado);
        return res.status(500).json({ error: textConvidado });
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Erro geral:", error);
    return res.status(500).json({ success: false });
  }
}