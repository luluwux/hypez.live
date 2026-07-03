import { redirect } from 'next/navigation'

const BOT_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1167849489755811960&permissions=5630429932145857&integration_type=0&scope=bot+applications.commands'

export default function AddBotPage() {
    redirect(BOT_INVITE_URL)
}
