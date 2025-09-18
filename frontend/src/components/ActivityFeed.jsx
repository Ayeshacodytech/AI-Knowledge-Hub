import { Card } from "./Card";
import { Activity,FileText } from "lucide-react";
export const ActivityFeed = ({ activities }) => (
  <Card className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Activity size={20} className="text-blue-600" />
      Team Activity
    </h3>
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity._id}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText size={14} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>by {activity.lastEditedBy?.name}</span>
              <span>•</span>
              <span>{new Date(activity.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);
