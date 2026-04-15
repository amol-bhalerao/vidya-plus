import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WebsiteManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Website content tools are available through the backend routes and can now be managed locally.
        </p>
      </CardContent>
    </Card>
  );
};

export default WebsiteManager;
