import { DashboardLayout } from "@/components/dashboard-layout"
import { RemindersHeader } from "@/components/reminders/reminders-header"
import { RemindersList } from "@/components/reminders/reminders-list"
import { UpcomingTasks } from "@/components/reminders/upcoming-tasks"
import { RemindersCalendar } from "@/components/reminders/reminders-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RemindersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <RemindersHeader />
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Список</TabsTrigger>
            <TabsTrigger value="calendar">Календарь</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RemindersList />
              </div>
              <div>
                <UpcomingTasks />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="calendar" className="mt-6">
            <RemindersCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
