import { notifyOwner } from "./_core/notification";

export interface EmailNotificationData {
  recipientEmail: string;
  recipientName: string;
  type: "assessment_assigned" | "assessment_completed" | "report_ready";
  companyName: string;
  assessmentTitle: string;
  assessmentUrl?: string;
  reportUrl?: string;
}

/**
 * Send email notification for assessment events
 */
export async function sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
  const { recipientEmail, recipientName, type, companyName, assessmentTitle, assessmentUrl, reportUrl } = data;

  let title = "";
  let content = "";

  switch (type) {
    case "assessment_assigned":
      title = `Nova Avaliação Atribuída: ${assessmentTitle}`;
      content = `
Olá ${recipientName},

Uma nova avaliação de maturidade de TI foi atribuída para você:

Empresa: ${companyName}
Avaliação: ${assessmentTitle}

${assessmentUrl ? `Acesse a avaliação: ${assessmentUrl}` : ""}

Por favor, complete a avaliação assim que possível.

Atenciosamente,
Plataforma de Avaliação de Maturidade de TI
      `;
      break;

    case "assessment_completed":
      title = `Avaliação Concluída: ${assessmentTitle}`;
      content = `
Olá ${recipientName},

A avaliação de maturidade de TI foi concluída com sucesso:

Empresa: ${companyName}
Avaliação: ${assessmentTitle}

${reportUrl ? `Visualize o relatório: ${reportUrl}` : ""}

Obrigado por completar a avaliação.

Atenciosamente,
Plataforma de Avaliação de Maturidade de TI
      `;
      break;

    case "report_ready":
      title = `Relatório Disponível: ${assessmentTitle}`;
      content = `
Olá ${recipientName},

O relatório de avaliação de maturidade de TI está pronto:

Empresa: ${companyName}
Avaliação: ${assessmentTitle}

${reportUrl ? `Baixe o relatório: ${reportUrl}` : ""}

O relatório contém análise detalhada e recomendações personalizadas.

Atenciosamente,
Plataforma de Avaliação de Maturidade de TI
      `;
      break;
  }

  try {
    // Use the built-in notification system to alert the owner
    // In a production system, this would integrate with an email service like SendGrid, AWS SES, etc.
    await notifyOwner({
      title,
      content: `${recipientName} (${recipientEmail}): ${content}`,
    });

    return true;
  } catch (error) {
    console.error(`Failed to send email notification: ${error}`);
    return false;
  }
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmailNotifications(
  recipients: EmailNotificationData[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmailNotification(recipient);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
