import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Calendar, Hash, AtSign, User } from 'lucide-react'
import { getAvatarColor, getInitials, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login?redirect=/profile')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">Profile</h1>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile.photo_url || undefined} />
              <AvatarFallback className={cn(
                "text-white font-bold text-3xl bg-gradient-to-tr",
                getAvatarColor(profile.first_name || 'User')
              )}>
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {profile.telegram_username && (
                  <span>@{profile.telegram_username}</span>
                )}
                {profile.is_admin && (
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <h3 className="mb-4 font-semibold text-foreground">Telegram Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telegram ID</p>
                <p className="font-medium">{profile.telegram_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{profile.first_name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{profile.last_name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <AtSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">
                  {profile.telegram_username ? `@${profile.telegram_username}` : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
