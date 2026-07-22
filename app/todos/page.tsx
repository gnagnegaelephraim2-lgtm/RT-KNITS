import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul className="p-8 flex flex-col gap-2">
      {todos?.map((todo) => (
        <li key={todo.id} className="border-b border-border py-1">{todo.name}</li>
      ))}
    </ul>
  )
}
