export default async function handler(req: any, res: any) {
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

    // 📩 Email para você (noivos)
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: "service_15m06v9",
        template_id: "template_gvlgpk8",
        user_id: "vMbgZBpGnITp0wp_m",
        template_params: {
          nomes_do_grupo,
          grupo,
          data_confirmacao,
          email_convidado,
        },
      }),
    });

    // 📩 Email para convidado (só se confirmou)
    if (enviarEmailConvidado) {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: "service_15m06v9",
          template_id: "template_gs1ecx4",
          user_id: "vMbgZBpGnITp0wp_m",
          template_params: {
            nome,
            nomes_do_grupo,
            data_evento,
            data_confirmacao,
            email_convidado,
          },
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
}