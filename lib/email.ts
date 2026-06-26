import "server-only"

import nodemailer from "nodemailer"
import type { SendMailOptions } from "nodemailer"

type MailPayload = Pick<SendMailOptions, "to" | "subject" | "html" | "text">

function getSmtpPort() {
  const port = Number(process.env.SMTP_PORT ?? 587)
  return Number.isFinite(port) ? port : 587
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendMail(payload: MailPayload) {
  if (!isSmtpConfigured()) {
    console.warn("SMTP não configurado. E-mail não enviado.")
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    ...payload,
  })
}

