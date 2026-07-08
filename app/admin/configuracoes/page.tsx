import { ImageIcon, MessageCircle, Settings } from "lucide-react"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminInput, AdminTextarea } from "@/components/admin-form-fields"
import { AdminProductImageUpload } from "@/components/admin-product-image-upload"
import { PrivatePageHeader } from "@/components/private-page-header"
import { prisma } from "@/lib/prisma"
import {
  loginImageSettings,
  orderMessageSettings,
  paymentDiscountSettings,
  storeWhatsAppSetting,
} from "@/lib/site-settings"
import { updateLoginImagesAction } from "./actions"

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          ...loginImageSettings.map((item) => item.key),
          storeWhatsAppSetting.key,
          orderMessageSettings.whatsapp.key,
          orderMessageSettings.emailSubject.key,
          orderMessageSettings.emailMessage.key,
          paymentDiscountSettings.pix.key,
          paymentDiscountSettings.card.key,
          paymentDiscountSettings.boleto.key,
        ],
      },
    },
  })
  const values = new Map(settings.map((setting) => [setting.key, setting.value]))

  return (
    <main>
      <PrivatePageHeader
        eyebrow="Configurações"
        title={
          <>
            Ajustes da <span className="text-lime neon-glow">experiência.</span>
          </>
        }
        description="Troque as imagens exibidas na lateral da página de login, cadastro e recuperação de senha."
        icon={Settings}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <AdminActionForm
          action={updateLoginImagesAction}
          submitLabel="SALVAR CONFIGURAÇÕES"
          successMessage="Configurações salvas."
          className="rounded-2xl border border-border bg-graphite p-5 md:p-7"
        >
          <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime">
                <MessageCircle className="h-4 w-4" />
                Atendimento
              </p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em]">Atendimento do sistema</h2>
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-4">
            <AdminInput
              name={storeWhatsAppSetting.key}
              label={storeWhatsAppSetting.label}
              mask="phone"
              defaultValue={values.get(storeWhatsAppSetting.key) ?? storeWhatsAppSetting.fallback}
              hint="Use DDD. O sistema adiciona o código do Brasil quando necessário."
              required
            />
            <AdminInput
              name={paymentDiscountSettings.pix.key}
              label={paymentDiscountSettings.pix.label}
              mask="decimal"
              min={0}
              max={100}
              defaultValue={values.get(paymentDiscountSettings.pix.key) ?? paymentDiscountSettings.pix.fallback}
              hint="Aplicado automaticamente ao escolher PIX."
              required
            />
            <AdminInput
              name={paymentDiscountSettings.card.key}
              label={paymentDiscountSettings.card.label}
              mask="decimal"
              min={0}
              max={100}
              defaultValue={values.get(paymentDiscountSettings.card.key) ?? paymentDiscountSettings.card.fallback}
              hint="Use 0 para cartão sem desconto."
              required
            />
            <AdminInput
              name={paymentDiscountSettings.boleto.key}
              label={paymentDiscountSettings.boleto.label}
              mask="decimal"
              min={0}
              max={100}
              defaultValue={values.get(paymentDiscountSettings.boleto.key) ?? paymentDiscountSettings.boleto.fallback}
              hint="Use 0 para boleto sem desconto."
              required
            />
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <AdminTextarea
              name={orderMessageSettings.whatsapp.key}
              label={orderMessageSettings.whatsapp.label}
              defaultValue={values.get(orderMessageSettings.whatsapp.key) ?? orderMessageSettings.whatsapp.fallback}
              hint="Placeholders: {pedido}, {cliente}, {itens}, {subtotal}, {descontos}, {total}, {pagamento}, {observacoes}."
              required
            />
            <div className="space-y-5">
              <AdminInput
                name={orderMessageSettings.emailSubject.key}
                label={orderMessageSettings.emailSubject.label}
                defaultValue={
                  values.get(orderMessageSettings.emailSubject.key) ?? orderMessageSettings.emailSubject.fallback
                }
                hint="Placeholders: {pedido}, {cliente}, {empresa}, {status}, {pagamento}, {total}."
                required
              />
              <AdminTextarea
                name={orderMessageSettings.emailMessage.key}
                label={orderMessageSettings.emailMessage.label}
                defaultValue={
                  values.get(orderMessageSettings.emailMessage.key) ?? orderMessageSettings.emailMessage.fallback
                }
                hint="Placeholders: {pedido}, {cliente}, {empresa}, {status}, {pagamento}, {total}."
                required
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime">
                <ImageIcon className="h-4 w-4" />
                Página de acesso
              </p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em]">Fotos do login</h2>
            </div>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            {loginImageSettings.map((setting) => (
              <AdminProductImageUpload
                key={setting.key}
                name={setting.key}
                label={setting.label}
                defaultValue={values.get(setting.key) ?? setting.fallback}
                folder="login"
                readyMessage="Imagem pronta para salvar nas configurações."
                emptyMessage="Ao salvar sem imagem, será usada a imagem padrão."
              />
            ))}
          </div>
        </AdminActionForm>
      </section>
    </main>
  )
}
