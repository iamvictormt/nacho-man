import "server-only"

import nodemailer from "nodemailer"
import type { SendMailOptions } from "nodemailer"

type MailPayload = Pick<SendMailOptions, "to" | "subject" | "html" | "text" | "cc" | "bcc">

function getSmtpPort() {
  const port = Number(process.env.SMTP_PORT ?? 587)
  return Number.isFinite(port) ? port : 587
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function extractEmailAddress(value?: string) {
  if (!value) return undefined

  const address = value.match(/<([^<>]+)>/)?.[1] ?? value
  return address.trim() || undefined
}

function getSenderCopyAddress() {
  return extractEmailAddress(process.env.SMTP_FROM) ?? process.env.SMTP_USER
}

function recipientText(value: SendMailOptions["to"]): string {
  if (!value) return ""
  if (Array.isArray(value)) return value.map((item) => recipientText(item)).join(" ")
  if (typeof value === "object" && "address" in value) return value.address

  return String(value)
}

function addSenderCopyBcc(existingBcc: SendMailOptions["bcc"], senderCopy?: string): SendMailOptions["bcc"] {
  if (!senderCopy) return existingBcc
  if (!existingBcc) return senderCopy
  if (Array.isArray(existingBcc)) return [...existingBcc, senderCopy]

  return [existingBcc, senderCopy]
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

  const senderCopy = getSenderCopyAddress()
  const bcc =
    senderCopy && !recipientText(payload.to).toLowerCase().includes(senderCopy.toLowerCase())
      ? addSenderCopyBcc(payload.bcc, senderCopy)
      : payload.bcc

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    ...payload,
    bcc,
  })
}
