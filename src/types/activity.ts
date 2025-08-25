
export interface Activity {
  id: string;
  type: 'project_created' | 'project_investment' | 'terrain_added' | 'milestone_completed' | 'follow' | 'notification' | 'comment_created' | 'project_liked' | 'comment_liked';
  title: string;
  description: string;
  date: string;
  icon: string;
  entityId?: string | number;
  entityType?: string;
  metadata?: {
    amount?: number;
    projectTitle?: string;
    userName?: string;
    milestoneName?: string;
    commentText?: string;
    [key: string]: any;
  };
}

export interface ActivityFilters {
  type?: Activity['type'];
  limit?: number;
  offset?: number;
}
