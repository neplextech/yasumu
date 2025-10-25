// import { WorkspaceModuleType } from "@yasumu/core";
// import { YasumuSchemaParsableScript, YasumuSchemaActions } from "../src";

// const WorkspaceSchema = {
//     annotation: "workspace",
//     schema: {
//         Metadata: {
//             type: "object",
//             schema: {
//                 name: {
//                     schema: {
//                         type: "string",
//                     },
//                     required: true,
//                 },
//                 id: {
//                     schema: {
//                         type: "string",
//                     },
//                     required: true,
//                 },
//                 createdAt: {
//                     schema: {
//                         type: "number",
//                     },
//                     required: true,
//                 },
//                 version: {
//                     schema: {
//                         type: "string",
//                     },
//                     required: true,
//                 },
//             },
//             required: true,
//         },
//         [WorkspaceModuleType.Rest]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//         [WorkspaceModuleType.GraphQL]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//         [WorkspaceModuleType.SMTP]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//         [WorkspaceModuleType.SSE]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//         [WorkspaceModuleType.SocketIO]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//         [WorkspaceModuleType.Websocket]: {
//             required: true,
//             type: "object",
//             schema: {
//                 entities: {
//                     schema: {
//                         type: "record",
//                         schema: {
//                             type: "object",
//                             schema: {
//                                 name: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 id: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 method: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                                 path: {
//                                     schema: {
//                                         type: "string",
//                                     },
//                                     required: true,
//                                 },
//                             },
//                         },
//                     },
//                     required: true,
//                 },
//             },
//         },
//     },
// } as const satisfies YasumuSchemaParsableScript;

// const script = `
// @workspace

// Metadata {
//     name: "My Workspace"
//     id: "5b29b86c-f11e-4c8a-8cd3-bca92cb38297"
//     createdAt: 123456
//     version: "1.0.0"
// }

// Rest {
//     entities: {
//         \`5b29b86c-f11e-4c8a-8cd3-bca92cb38297\`: {
//             name: "My Entity"
//             id: "5b29b86c-f11e-4c8a-8cd3-bca92cb38297"
//             method: "GET"
//             path: "/entity"
//         }
//     }
// }

// GraphQL {
//     entities: {}
// }

// SMTP {
//     entities: {}
// }

// SSE {
//     entities: {}
// }

// SocketIO {
//     entities: {}
// }

// WebSocket {
//     entities: {}
// }
// `;

// const start = () => {
//     const actions = new YasumuSchemaActions(WorkspaceSchema);
//     const parsed = actions.parse(script);
//     console.log(JSON.stringify(parsed, null, 4));
//     console.log("");
//     console.log(actions.serialize(parsed));
// };

// start();
