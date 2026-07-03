import { auth } from "@/auth";
import { LoginButton } from "@/components/auth/login-button";
import { UserMenu } from "@/components/auth/user-menu";

export async function UserButton() {
    const session = await auth();

    if (!session?.user) {
        return <LoginButton />;
    }

    return <UserMenu session={session} />;
}
