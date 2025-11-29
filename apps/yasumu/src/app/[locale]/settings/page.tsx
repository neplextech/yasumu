'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Separator } from '@yasumu/ui/components/separator';
import { Input } from '@yasumu/ui/components/input';
import { Button } from '@yasumu/ui/components/button';
import { Switch } from '@yasumu/ui/components/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import SettingsSection from './_components/settings-section';
import SettingItem from './_components/setting-item';

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('monospace');
  const [wordWrap, setWordWrap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [requestTimeout, setRequestTimeout] = useState('30000');
  const [followRedirects, setFollowRedirects] = useState(true);
  const [sslVerification, setSslVerification] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  const [networkPermission, setNetworkPermission] = useState(true);
  const [readPermission, setReadPermission] = useState(false);
  const [writePermission, setWritePermission] = useState(false);
  const [envPermission, setEnvPermission] = useState(false);
  const [runPermission, setRunPermission] = useState(false);
  const [ffiPermission, setFfiPermission] = useState(false);

  return (
    <div className="flex h-full bg-background">
      <Tabs defaultValue="gui" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 py-4 bg-background/50 backdrop-blur">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure application preferences and runtime settings
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="gui">GUI</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="runtime">Runtime</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="extensions">Extensions</TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="gui" className="m-0">
              <div className="max-w-3xl space-y-6">
                <SettingsSection
                  title="Appearance"
                  description="Customize the look and feel"
                >
                  <SettingItem
                    label="Theme"
                    description="Choose your preferred color theme"
                  >
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Accent Color"
                    description="Choose the accent color for the interface"
                  >
                    <Select defaultValue="blue">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="General"
                  description="General application settings"
                >
                  <SettingItem
                    label="Startup Behavior"
                    description="What should happen when the application starts"
                  >
                    <Select defaultValue="restore">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Window</SelectItem>
                        <SelectItem value="restore">
                          Restore Last Session
                        </SelectItem>
                        <SelectItem value="workspace">
                          Open Last Workspace
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Language"
                    description="Choose your preferred language"
                  >
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Notifications"
                    description="Enable desktop notifications"
                  >
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </SettingItem>
                  <SettingItem
                    label="Auto Update"
                    description="Automatically download and install updates"
                  >
                    <Switch
                      checked={autoUpdate}
                      onCheckedChange={setAutoUpdate}
                    />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Privacy"
                  description="Privacy and data settings"
                >
                  <SettingItem
                    label="Telemetry"
                    description="Send usage data to help improve the application"
                  >
                    <Switch defaultChecked={false} />
                  </SettingItem>
                  <SettingItem
                    label="Crash Reports"
                    description="Automatically send crash reports"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                </SettingsSection>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="m-0">
              <div className="max-w-3xl space-y-6">
                <SettingsSection
                  title="Font"
                  description="Configure editor font settings"
                >
                  <SettingItem
                    label="Font Family"
                    description="Font family for code editors"
                  >
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Consolas">Consolas</SelectItem>
                        <SelectItem value="Fira Code">Fira Code</SelectItem>
                        <SelectItem value="JetBrains Mono">
                          JetBrains Mono
                        </SelectItem>
                        <SelectItem value="Source Code Pro">
                          Source Code Pro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Font Size"
                    description="Font size in pixels"
                  >
                    <Input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      min="8"
                      max="24"
                      className="w-full"
                    />
                  </SettingItem>
                  <SettingItem
                    label="Font Weight"
                    description="Font weight for code text"
                  >
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Editor"
                  description="Code editor behavior and features"
                >
                  <SettingItem
                    label="Word Wrap"
                    description="Wrap lines that exceed the editor width"
                  >
                    <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
                  </SettingItem>
                  <SettingItem
                    label="Line Numbers"
                    description="Show line numbers in the editor"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Highlight Active Line"
                    description="Highlight the line where the cursor is"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Auto Indent"
                    description="Automatically indent new lines"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Tab Size"
                    description="Number of spaces for indentation"
                  >
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Spaces</SelectItem>
                        <SelectItem value="4">4 Spaces</SelectItem>
                        <SelectItem value="8">8 Spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Insert Spaces"
                    description="Use spaces instead of tabs"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Auto Save"
                  description="Automatically save your work"
                >
                  <SettingItem
                    label="Auto Save"
                    description="Automatically save changes"
                  >
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </SettingItem>
                  {autoSave && (
                    <SettingItem
                      label="Auto Save Delay"
                      description="Delay before auto-saving (milliseconds)"
                    >
                      <Select defaultValue="1000">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 ms</SelectItem>
                          <SelectItem value="1000">1000 ms</SelectItem>
                          <SelectItem value="2000">2000 ms</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingItem>
                  )}
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Code Features"
                  description="Advanced code editor features"
                >
                  <SettingItem
                    label="Syntax Highlighting"
                    description="Enable syntax highlighting for code"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Code Folding"
                    description="Enable code folding"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Bracket Matching"
                    description="Highlight matching brackets"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem label="Minimap" description="Show code minimap">
                    <Switch defaultChecked={false} />
                  </SettingItem>
                </SettingsSection>
              </div>
            </TabsContent>

            <TabsContent value="runtime" className="m-0">
              <div className="max-w-3xl space-y-6">
                <SettingsSection
                  title="Deno Runtime"
                  description="Configure Deno runtime settings and permissions"
                >
                  <SettingItem
                    label="Deno Version"
                    description="Deno runtime version"
                  >
                    <Select defaultValue="latest">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="1.40.0">1.40.0</SelectItem>
                        <SelectItem value="1.39.0">1.39.0</SelectItem>
                        <SelectItem value="1.38.0">1.38.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                  <SettingItem
                    label="Unstable Features"
                    description="Enable unstable Deno features"
                  >
                    <Switch defaultChecked={false} />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Permissions"
                  description="Configure Deno runtime permissions"
                >
                  <SettingItem
                    label="Network Access"
                    description="Allow scripts to access the network"
                  >
                    <Switch
                      checked={networkPermission}
                      onCheckedChange={setNetworkPermission}
                    />
                  </SettingItem>
                  <SettingItem
                    label="Read File System"
                    description="Allow scripts to read files from the file system"
                  >
                    <Switch
                      checked={readPermission}
                      onCheckedChange={setReadPermission}
                    />
                  </SettingItem>
                  {readPermission && (
                    <SettingItem
                      label="Read Paths"
                      description="Comma-separated list of allowed read paths (leave empty for all)"
                    >
                      <Input
                        placeholder="/tmp,/home"
                        className="w-full font-mono text-xs"
                      />
                    </SettingItem>
                  )}
                  <SettingItem
                    label="Write File System"
                    description="Allow scripts to write files to the file system"
                  >
                    <Switch
                      checked={writePermission}
                      onCheckedChange={setWritePermission}
                    />
                  </SettingItem>
                  {writePermission && (
                    <SettingItem
                      label="Write Paths"
                      description="Comma-separated list of allowed write paths (leave empty for all)"
                    >
                      <Input
                        placeholder="/tmp"
                        className="w-full font-mono text-xs"
                      />
                    </SettingItem>
                  )}
                  <SettingItem
                    label="Environment Variables"
                    description="Allow scripts to access environment variables"
                  >
                    <Switch
                      checked={envPermission}
                      onCheckedChange={setEnvPermission}
                    />
                  </SettingItem>
                  {envPermission && (
                    <SettingItem
                      label="Allowed Env Vars"
                      description="Comma-separated list of allowed environment variable names (leave empty for all)"
                    >
                      <Input
                        placeholder="HOME,USER"
                        className="w-full font-mono text-xs"
                      />
                    </SettingItem>
                  )}
                  <SettingItem
                    label="Run Subprocesses"
                    description="Allow scripts to run subprocesses"
                  >
                    <Switch
                      checked={runPermission}
                      onCheckedChange={setRunPermission}
                    />
                  </SettingItem>
                  {runPermission && (
                    <SettingItem
                      label="Allowed Commands"
                      description="Comma-separated list of allowed commands (leave empty for all)"
                    >
                      <Input
                        placeholder="git,npm"
                        className="w-full font-mono text-xs"
                      />
                    </SettingItem>
                  )}
                  <SettingItem
                    label="FFI (Foreign Function Interface)"
                    description="Allow scripts to use FFI to call native code"
                  >
                    <Switch
                      checked={ffiPermission}
                      onCheckedChange={setFfiPermission}
                    />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Import Maps"
                  description="Configure import maps for Deno"
                >
                  <SettingItem
                    label="Import Map File"
                    description="Path to import map JSON file"
                  >
                    <Input
                      placeholder="./import_map.json"
                      className="w-full font-mono text-xs"
                    />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="TypeScript"
                  description="TypeScript configuration"
                >
                  <SettingItem
                    label="Type Checking"
                    description="Enable TypeScript type checking"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Type Definitions"
                    description="Include Deno type definitions"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Config File"
                    description="Path to tsconfig.json file"
                  >
                    <Input
                      placeholder="./tsconfig.json"
                      className="w-full font-mono text-xs"
                    />
                  </SettingItem>
                </SettingsSection>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="m-0">
              <div className="max-w-3xl space-y-6">
                <SettingsSection
                  title="HTTP Requests"
                  description="Configure HTTP request behavior"
                >
                  <SettingItem
                    label="Request Timeout"
                    description="Default timeout for requests (milliseconds)"
                  >
                    <Input
                      type="number"
                      value={requestTimeout}
                      onChange={(e) => setRequestTimeout(e.target.value)}
                      className="w-full"
                    />
                  </SettingItem>
                  <SettingItem
                    label="Follow Redirects"
                    description="Automatically follow HTTP redirects"
                  >
                    <Switch
                      checked={followRedirects}
                      onCheckedChange={setFollowRedirects}
                    />
                  </SettingItem>
                  {followRedirects && (
                    <SettingItem
                      label="Max Redirects"
                      description="Maximum number of redirects to follow"
                    >
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingItem>
                  )}
                  <SettingItem
                    label="SSL Verification"
                    description="Verify SSL certificates"
                  >
                    <Switch
                      checked={sslVerification}
                      onCheckedChange={setSslVerification}
                    />
                  </SettingItem>
                  <SettingItem
                    label="Store Cookies"
                    description="Automatically store and send cookies"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Proxy"
                  description="Configure proxy settings"
                >
                  <SettingItem
                    label="Enable Proxy"
                    description="Use a proxy server for requests"
                  >
                    <Switch defaultChecked={false} />
                  </SettingItem>
                  <SettingItem
                    label="Proxy URL"
                    description="Proxy server URL (e.g., http://proxy.example.com:8080)"
                  >
                    <Input
                      placeholder="http://proxy.example.com:8080"
                      className="w-full font-mono text-xs"
                      disabled
                    />
                  </SettingItem>
                  <SettingItem
                    label="Proxy Authentication"
                    description="Username and password for proxy (if required)"
                  >
                    <div className="space-y-2">
                      <Input
                        placeholder="Username"
                        className="w-full"
                        disabled
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="w-full"
                        disabled
                      />
                    </div>
                  </SettingItem>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Request Headers"
                  description="Default request headers"
                >
                  <SettingItem
                    label="User Agent"
                    description="Default User-Agent header for requests"
                  >
                    <Input
                      placeholder="Yasumu/1.0"
                      className="w-full font-mono text-xs"
                    />
                  </SettingItem>
                  <SettingItem
                    label="Default Headers"
                    description="Add default headers to all requests"
                  >
                    <Switch defaultChecked={false} />
                  </SettingItem>
                </SettingsSection>
              </div>
            </TabsContent>

            <TabsContent value="extensions" className="m-0">
              <div className="max-w-3xl space-y-6">
                <SettingsSection
                  title="Extensions"
                  description="Manage installed extensions"
                >
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      No extensions installed yet. Browse and install extensions
                      from the marketplace.
                    </div>
                    <Button variant="outline">Browse Extensions</Button>
                  </div>
                </SettingsSection>

                <Separator />

                <SettingsSection
                  title="Extension Settings"
                  description="Configure extension behavior"
                >
                  <SettingItem
                    label="Auto Update Extensions"
                    description="Automatically update extensions"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                  <SettingItem
                    label="Extension Marketplace"
                    description="Enable extension marketplace"
                  >
                    <Switch defaultChecked={true} />
                  </SettingItem>
                </SettingsSection>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
