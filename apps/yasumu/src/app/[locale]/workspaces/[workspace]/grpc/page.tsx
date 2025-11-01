'use client';

import { useState } from 'react';
import { Input } from '@yasumu/ui/components/input';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import SendButton from './(components)/send-button';
import ServiceMethodSelector from './(components)/service-method-selector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';

const mockServices = ['UserService', 'ProductService', 'OrderService'];
const mockMethods = ['GetUser', 'CreateUser', 'UpdateUser', 'DeleteUser'];

const mockRequest = `{
  "id": "1",
  "name": "John Doe",
  "email": "john.doe@example.com"
}`;

export default function GrpcPage() {
  const [selectedService, setSelectedService] = useState<string>('UserService');
  const [selectedMethod, setSelectedMethod] = useState<string>('GetUser');
  const [request, setRequest] = useState(mockRequest);

  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Input placeholder="Enter gRPC server URL" />
        <SendButton />
      </div>
      <Separator />
      <ServiceMethodSelector
        services={mockServices}
        methods={mockMethods}
        selectedService={selectedService}
        selectedMethod={selectedMethod}
        onServiceChange={setSelectedService}
        onMethodChange={setSelectedMethod}
      />
      <Separator />
      <Tabs defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="protobuf">Protobuf</TabsTrigger>
          <TabsTrigger value="pre-request-script">
            Pre-request Script
          </TabsTrigger>
          <TabsTrigger value="post-response-script">
            Post-response Script
          </TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="request" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Request Body</label>
            <Textarea
              placeholder="Enter request body (JSON)..."
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="font-mono min-h-[200px]"
            />
          </div>
        </TabsContent>
        <TabsContent value="metadata">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="protobuf">
          <Textarea
            placeholder="Enter or paste your .proto file content here..."
            className="font-mono min-h-[300px]"
            defaultValue={`syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc UpdateUser (UpdateUserRequest) returns (User);
  rpc DeleteUser (DeleteUserRequest) returns (Empty);
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message UpdateUserRequest {
  string id = 1;
  string name = 2;
  string email = 3;
}

message DeleteUserRequest {
  string id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

message Empty {
}`}
          />
        </TabsContent>
        <TabsContent value="pre-request-script">
          <Textarea placeholder="Your pre-request script goes here..." />
        </TabsContent>
        <TabsContent value="post-response-script">
          <Textarea placeholder="Your post-response script goes here..." />
        </TabsContent>
        <TabsContent value="tests">
          <Textarea placeholder="Your test script goes here..." />
        </TabsContent>
        <TabsContent value="settings">Settings Editor</TabsContent>
      </Tabs>
    </main>
  );
}
