export const PROVIDER_DOC_DATA = {
    "groq":  {
                 "description":  "GroqCloud 极速推理服务提供商，支持的参数依模型类别而定。",
                 "categories":  {
                                    "reasoning_chat":  {
                                                           "description":  "推理型大语言模型 (DeepSeek-R1 蒸馏系列)",
                                                           "models":  [
                                                                          "DeepSeek R1 Distill Llama 70B"
                                                                      ],
                                                           "modifiable_parameters":  {
                                                                                         "temperature":  {
                                                                                                             "type":  "float",
                                                                                                             "range":  "0.0 - 2.0",
                                                                                                             "default":  0.6,
                                                                                                             "description":  "随机性/温度。推理模型推荐较低温度（如0.6）以保持逻辑严密，0.0为完全确定性。"
                                                                                                         },
                                                                                         "top_p":  {
                                                                                                       "type":  "float",
                                                                                                       "range":  "0.0 - 1.0",
                                                                                                       "default":  0.95,
                                                                                                       "description":  "核采样。控制词汇采样的累计概率。"
                                                                                                   },
                                                                                         "max_tokens":  {
                                                                                                            "type":  "integer",
                                                                                                            "range":  "1 - 8192 (或 16384)",
                                                                                                            "default":  "None (由模型最大上下文决定)",
                                                                                                            "description":  "生成回复的最大Token数（包含推理Token）。"
                                                                                                        },
                                                                                         "stop":  {
                                                                                                      "type":  "array of strings",
                                                                                                      "range":  "最多4个词",
                                                                                                      "default":  "null",
                                                                                                      "description":  "停止词列表，生成这些词时自动截止。"
                                                                                                  },
                                                                                         "stream":  {
                                                                                                        "type":  "boolean",
                                                                                                        "range":  "true/false",
                                                                                                        "default":  "false",
                                                                                                        "description":  "是否开启流式输出。"
                                                                                                    },
                                                                                         "presence_penalty":  {
                                                                                                                  "type":  "float",
                                                                                                                  "range":  "-2.0 - 2.0",
                                                                                                                  "default":  0,
                                                                                                                  "description":  "存在惩罚。正值鼓励模型谈论新话题。"
                                                                                                              },
                                                                                         "frequency_penalty":  {
                                                                                                                   "type":  "float",
                                                                                                                   "range":  "-2.0 - 2.0",
                                                                                                                   "default":  0,
                                                                                                                   "description":  "频率惩罚。正值抑制模型重复相同词汇。"
                                                                                                               },
                                                                                         "seed":  {
                                                                                                      "type":  "integer",
                                                                                                      "range":  "任意整数",
                                                                                                      "default":  "null",
                                                                                                      "description":  "随机种子。设置相同种子可以获得高度一致的输出。"
                                                                                                  },
                                                                                         "response_format":  {
                                                                                                                 "type":  "object",
                                                                                                                 "range":  "{\"type\": \"json_object\"}",
                                                                                                                 "default":  "null",
                                                                                                                 "description":  "响应格式。设置为JSON Mode可强制模型输出合法JSON。"
                                                                                                             }
                                                                                     },
                                                           "free_models":  [
                                                                               "DeepSeek R1 Distill Llama 70B"
                                                                           ]
                                                       },
                                    "standard_chat":  {
                                                          "description":  "标准文本/对话模型",
                                                          "models":  [
                                                                         "Gemma 2 9B Instruction Tuned",
                                                                         "gpt-oss-120b",
                                                                         "gpt-oss-20b",
                                                                         "Kimi K2 Instruct",
                                                                         "Llama 4 Maverick 17B 128E Instruct Preview",
                                                                         "Llama 4 Scout 17B 16E Instruct Preview",
                                                                         "Llama-3.1-8b-instant",
                                                                         "Qwen3-32B"
                                                                     ],
                                                          "modifiable_parameters":  {
                                                                                        "temperature":  {
                                                                                                            "type":  "float",
                                                                                                            "range":  "0.0 - 2.0",
                                                                                                            "default":  0.7,
                                                                                                            "description":  "温度。值越高输出越具创意/随机。"
                                                                                                        },
                                                                                        "top_p":  {
                                                                                                      "type":  "float",
                                                                                                      "range":  "0.0 - 1.0",
                                                                                                      "default":  0.9,
                                                                                                      "description":  "核采样。"
                                                                                                  },
                                                                                        "max_tokens":  {
                                                                                                           "type":  "integer",
                                                                                                           "range":  "1 - 8192",
                                                                                                           "default":  "null",
                                                                                                           "description":  "最大输出Token数。"
                                                                                                       },
                                                                                        "stop":  {
                                                                                                     "type":  "array of strings",
                                                                                                     "range":  "最多4个词",
                                                                                                     "default":  "null",
                                                                                                     "description":  "停止词列表。"
                                                                                                 },
                                                                                        "stream":  {
                                                                                                       "type":  "boolean",
                                                                                                       "range":  "true/false",
                                                                                                       "default":  "false",
                                                                                                       "description":  "流式传输。"
                                                                                                   },
                                                                                        "presence_penalty":  {
                                                                                                                 "type":  "float",
                                                                                                                 "range":  "-2.0 - 2.0",
                                                                                                                 "default":  0,
                                                                                                                 "description":  "新话题惩罚。"
                                                                                                             },
                                                                                        "frequency_penalty":  {
                                                                                                                  "type":  "float",
                                                                                                                  "range":  "-2.0 - 2.0",
                                                                                                                  "default":  0,
                                                                                                                  "description":  "重复词惩罚。"
                                                                                                              },
                                                                                        "seed":  {
                                                                                                     "type":  "integer",
                                                                                                     "range":  "任意整数",
                                                                                                     "default":  "null",
                                                                                                     "description":  "随机种子。"
                                                                                                 },
                                                                                        "response_format":  {
                                                                                                                "type":  "object",
                                                                                                                "range":  "{\"type\": \"json_object\"}",
                                                                                                                "default":  "null",
                                                                                                                "description":  "强制JSON格式。"
                                                                                                            }
                                                                                    },
                                                          "free_models":  [
                                                                              "Gemma 2 9B Instruction Tuned",
                                                                              "gpt-oss-120b",
                                                                              "gpt-oss-20b",
                                                                              "Kimi K2 Instruct",
                                                                              "Llama 4 Maverick 17B 128E Instruct Preview",
                                                                              "Llama 4 Scout 17B 16E Instruct Preview",
                                                                              "Llama-3.1-8b-instant",
                                                                              "Qwen3-32B"
                                                                          ]
                                                      },
                                    "audio_transcription":  {
                                                                "description":  "语音转文字 (Whisper) 模型",
                                                                "models":  [
                                                                               "distil-whisper-large-v3-en",
                                                                               "whisper-large-v3",
                                                                               "whisper-large-v3-turbo"
                                                                           ],
                                                                "modifiable_parameters":  {
                                                                                              "prompt":  {
                                                                                                             "type":  "string",
                                                                                                             "range":  "文本",
                                                                                                             "default":  "null",
                                                                                                             "description":  "引导音频转写的上下文提示词（例如专有名词或特定书写风格）。"
                                                                                                         },
                                                                                              "response_format":  {
                                                                                                                      "type":  "string",
                                                                                                                      "range":  "json, verbose_json, text, vtt, srt",
                                                                                                                      "default":  "json",
                                                                                                                      "description":  "输出音频转录结果的格式。"
                                                                                                                  },
                                                                                              "temperature":  {
                                                                                                                  "type":  "float",
                                                                                                                  "range":  "0.0 - 1.0",
                                                                                                                  "default":  0,
                                                                                                                  "description":  "温度。转写音频建议设为0.0以获得最高准确度。"
                                                                                                              },
                                                                                              "language":  {
                                                                                                               "type":  "string",
                                                                                                               "range":  "ISO-639-1 代码 (如 zh, en, ja)",
                                                                                                               "default":  "自动检测",
                                                                                                               "description":  "音频的语言编码。对于 distil-whisper-large-v3-en 仅支持 \u0027en\u0027。"
                                                                                                           }
                                                                                          },
                                                                "free_models":  [
                                                                                    "distil-whisper-large-v3-en",
                                                                                    "whisper-large-v3",
                                                                                    "whisper-large-v3-turbo"
                                                                                ]
                                                            }
                                }
             },
    "智谱 AI":  {
                  "description":  "智谱AI大模型开放平台，接口完全兼容 OpenAI SDK，具有专有 do_sample 和 thinking 控制参数。",
                  "categories":  {
                                     "chat_text":  {
                                                       "description":  "对话/文本生成大模型",
                                                       "models":  [
                                                                      "glm-4-flash",
                                                                      "glm-4-flash-250414",
                                                                      "glm-4.5-flash",
                                                                      "glm-4.7-flash",
                                                                      "glm-3-turbo",
                                                                      "glm-4",
                                                                      "glm-4-0520",
                                                                      "glm-4-air",
                                                                      "glm-4-air-0111",
                                                                      "glm-4-air-250414",
                                                                      "glm-4-long",
                                                                      "glm-4-plus",
                                                                      "glm-4.5",
                                                                      "glm-4.5-air",
                                                                      "glm-4.5-x",
                                                                      "glm-4.6",
                                                                      "glm-4.7",
                                                                      "glm-5",
                                                                      "glm-5-turbo",
                                                                      "glm-5.1"
                                                                  ],
                                                       "modifiable_parameters":  {
                                                                                     "do_sample":  {
                                                                                                       "type":  "boolean",
                                                                                                       "range":  "true/false",
                                                                                                       "default":  "true",
                                                                                                       "description":  "智谱专有参数。是否启用采样策略。若设为 false，则为贪婪检索模式，temperature 和 top_p 等参数将失效，输出具高度确定性。"
                                                                                                   },
                                                                                     "thinking":  {
                                                                                                      "type":  "object",
                                                                                                      "range":  "{\"type\": \"enabled\" | \"disabled\"}",
                                                                                                      "default":  "null (自动)",
                                                                                                      "description":  "智谱推理控制。自 GLM-4.5+ 起支持。设置为 {\u0027type\u0027: \u0027enabled\u0027} 开启深度思考逻辑，模型将展示推理过程（包含在单独的 reasoning_content 字段中）。"
                                                                                                  },
                                                                                     "temperature":  {
                                                                                                         "type":  "float",
                                                                                                         "range":  "0.01 - 1.0 (不可为0)",
                                                                                                         "default":  0.95,
                                                                                                         "description":  "温度。采样随机性，值越高越具发散性。"
                                                                                                     },
                                                                                     "top_p":  {
                                                                                                   "type":  "float",
                                                                                                   "range":  "0.01 - 0.99 (不可为0和1)",
                                                                                                   "default":  0.7,
                                                                                                   "description":  "核采样。"
                                                                                               },
                                                                                     "max_tokens":  {
                                                                                                        "type":  "integer",
                                                                                                        "range":  "1 - 4096",
                                                                                                        "default":  1024,
                                                                                                        "description":  "最大输出Token数。"
                                                                                                    },
                                                                                     "stop":  {
                                                                                                  "type":  "array of strings",
                                                                                                  "range":  "最多4个词",
                                                                                                  "default":  "null",
                                                                                                  "description":  "停止词列表，生成时截止。"
                                                                                              },
                                                                                     "stream":  {
                                                                                                    "type":  "boolean",
                                                                                                    "range":  "true/false",
                                                                                                    "default":  "false",
                                                                                                    "description":  "流式输出。"
                                                                                                },
                                                                                     "tools":  {
                                                                                                   "type":  "array of objects",
                                                                                                   "range":  "符合OpenAI标准的工具定义",
                                                                                                   "default":  "null",
                                                                                                   "description":  "工具列表，用于函数调用 (Function Calling)。"
                                                                                               },
                                                                                     "tool_choice":  {
                                                                                                         "type":  "string/object",
                                                                                                         "range":  "none, auto, required 或指定函数",
                                                                                                         "default":  "auto",
                                                                                                         "description":  "控制大模型调用工具的策略。"
                                                                                                     },
                                                                                     "request_id":  {
                                                                                                        "type":  "string",
                                                                                                        "range":  "唯一字符串",
                                                                                                        "default":  "由系统生成",
                                                                                                        "description":  "客户端自定义请求ID，便于在异步或日志中追踪。"
                                                                                                    },
                                                                                     "user_id":  {
                                                                                                     "type":  "string",
                                                                                                     "range":  "唯一字符串",
                                                                                                     "default":  "null",
                                                                                                     "description":  "最终用户的唯一标识，可防止滥用或进行精细化计费统计。"
                                                                                                 }
                                                                                 },
                                                       "free_models":  [
                                                                           "glm-4-flash",
                                                                           "glm-4-flash-250414",
                                                                           "glm-4.5-flash",
                                                                           "glm-4.7-flash"
                                                                       ]
                                                   },
                                     "advanced_thinking":  {
                                                               "description":  "思维/推理增强版与高并发大语言模型",
                                                               "models":  [
                                                                              "glm-4-flashx",
                                                                              "glm-4-flashx-250414",
                                                                              "glm-4.7-flashx",
                                                                              "glm-z1-flash",
                                                                              "glm-z1-flashx",
                                                                              "glm-4-airx",
                                                                              "glm-4.5-airx",
                                                                              "glm-z1-air",
                                                                              "glm-z1-airx"
                                                                          ],
                                                               "modifiable_parameters":  {
                                                                                             "do_sample":  {
                                                                                                               "type":  "boolean",
                                                                                                               "range":  "true/false",
                                                                                                               "default":  "true",
                                                                                                               "description":  "是否启用采样策略。推理模型推荐在某些确定性场景下显式设为 false。"
                                                                                                           },
                                                                                             "thinking":  {
                                                                                                              "type":  "object",
                                                                                                              "range":  "{\"type\": \"enabled\" | \"disabled\"}",
                                                                                                              "default":  "{\"type\": \"enabled\"}",
                                                                                                              "description":  "推理控制。此系列模型默认开启深度思考逻辑，以高强度链式思考（CoT）推理出最终结果。可传入 {\u0027type\u0027: \u0027disabled\u0027} 强制跳过思考段。"
                                                                                                          },
                                                                                             "temperature":  {
                                                                                                                 "type":  "float",
                                                                                                                 "range":  "0.01 - 1.0",
                                                                                                                 "default":  0.8,
                                                                                                                 "description":  "温度。推理型模型推荐采用更保守的温度（如0.6-0.8）以获得高准确度推理。"
                                                                                                             },
                                                                                             "top_p":  {
                                                                                                           "type":  "float",
                                                                                                           "range":  "0.01 - 0.99",
                                                                                                           "default":  0.7,
                                                                                                           "description":  "核采样。"
                                                                                                       },
                                                                                             "max_tokens":  {
                                                                                                                "type":  "integer",
                                                                                                                "range":  "1 - 8192",
                                                                                                                "default":  2048,
                                                                                                                "description":  "最大输出Token数。"
                                                                                                            },
                                                                                             "stop":  {
                                                                                                          "type":  "array of strings",
                                                                                                          "range":  "最多4个词",
                                                                                                          "default":  "null",
                                                                                                          "description":  "停止词列表。"
                                                                                                      },
                                                                                             "stream":  {
                                                                                                            "type":  "boolean",
                                                                                                            "range":  "true/false",
                                                                                                            "default":  "false",
                                                                                                            "description":  "流式输出。"
                                                                                                        },
                                                                                             "request_id":  {
                                                                                                                "type":  "string",
                                                                                                                "range":  "唯一字符串",
                                                                                                                "default":  "null",
                                                                                                                "description":  "请求跟踪ID。"
                                                                                                            },
                                                                                             "user_id":  {
                                                                                                             "type":  "string",
                                                                                                             "range":  "唯一字符串",
                                                                                                             "default":  "null",
                                                                                                             "description":  "终端用户ID。"
                                                                                                         }
                                                                                         },
                                                               "free_models":  [
                                                                                   "glm-4-flashx",
                                                                                   "glm-4-flashx-250414",
                                                                                   "glm-4.7-flashx",
                                                                                   "glm-z1-flash",
                                                                                   "glm-z1-flashx"
                                                                               ]
                                                           },
                                     "multimodal_vision":  {
                                                               "description":  "多模态视觉大模型（支持图片与视频输入）",
                                                               "models":  [
                                                                              "glm-4.1v-thinking-flash",
                                                                              "glm-4.1v-thinking-flashx",
                                                                              "glm-4.6v-flash",
                                                                              "glm-4.6v-flashx",
                                                                              "glm-4v-flash",
                                                                              "glm-4.5v",
                                                                              "glm-4.6v",
                                                                              "glm-4v",
                                                                              "glm-4v-plus",
                                                                              "glm-4v-plus-0111",
                                                                              "glm-5v-turbo"
                                                                          ],
                                                               "modifiable_parameters":  {
                                                                                             "do_sample":  {
                                                                                                               "type":  "boolean",
                                                                                                               "range":  "true/false",
                                                                                                               "default":  "true",
                                                                                                               "description":  "是否启用采样策略。"
                                                                                                           },
                                                                                             "thinking":  {
                                                                                                              "type":  "object",
                                                                                                              "range":  "{\"type\": \"enabled\" | \"disabled\"}",
                                                                                                              "default":  "null",
                                                                                                              "description":  "多模态推理模型 (如 glm-4.1v-thinking-flash) 独有。是否显示视觉推理过程。"
                                                                                                          },
                                                                                             "temperature":  {
                                                                                                                 "type":  "float",
                                                                                                                 "range":  "0.01 - 1.0",
                                                                                                                 "default":  0.8,
                                                                                                                 "description":  "温度。"
                                                                                                             },
                                                                                             "top_p":  {
                                                                                                           "type":  "float",
                                                                                                           "range":  "0.01 - 0.99",
                                                                                                           "default":  0.7,
                                                                                                           "description":  "核采样。"
                                                                                                       },
                                                                                             "max_tokens":  {
                                                                                                                "type":  "integer",
                                                                                                                "range":  "1 - 4096",
                                                                                                                "default":  1024,
                                                                                                                "description":  "最大输出Token数。"
                                                                                                            },
                                                                                             "stream":  {
                                                                                                            "type":  "boolean",
                                                                                                            "range":  "true/false",
                                                                                                            "default":  "false",
                                                                                                            "description":  "流式输出。"
                                                                                                        },
                                                                                             "request_id":  {
                                                                                                                "type":  "string",
                                                                                                                "range":  "唯一ID",
                                                                                                                "default":  "null",
                                                                                                                "description":  "请求追踪ID。"
                                                                                                            },
                                                                                             "user_id":  {
                                                                                                             "type":  "string",
                                                                                                             "range":  "用户ID",
                                                                                                             "default":  "null",
                                                                                                             "description":  "终端用户标识。"
                                                                                                         }
                                                                                         },
                                                               "free_models":  [
                                                                                   "glm-4.1v-thinking-flash",
                                                                                   "glm-4.1v-thinking-flashx",
                                                                                   "glm-4.6v-flash",
                                                                                   "glm-4.6v-flashx",
                                                                                   "glm-4v-flash"
                                                                               ]
                                                           },
                                     "embedding":  {
                                                       "description":  "文本向量/嵌入模型",
                                                       "models":  [
                                                                      "embedding-2",
                                                                      "embedding-3",
                                                                      "text_embedding"
                                                                  ],
                                                       "modifiable_parameters":  {
                                                                                     "input":  {
                                                                                                   "type":  "string 或 array of strings",
                                                                                                   "range":  "字符串或字符串数组",
                                                                                                   "default":  "必填项",
                                                                                                   "description":  "要生成向量表示的输入文本。"
                                                                                               },
                                                                                     "dimensions":  {
                                                                                                        "type":  "integer",
                                                                                                        "range":  "仅 embedding-3 支持 (e.g. 512, 1024, 2048)",
                                                                                                        "default":  1024,
                                                                                                        "description":  "输出的向量维度。支持降低维度截断以节省向量数据库存储空间。"
                                                                                                    },
                                                                                     "user_id":  {
                                                                                                     "type":  "string",
                                                                                                     "range":  "唯一字符串",
                                                                                                     "default":  "null",
                                                                                                     "description":  "终端用户ID。"
                                                                                                 }
                                                                                 },
                                                       "free_models":  [

                                                                       ]
                                                   }
                                 }
              },
    "gemini":  {
                   "description":  "Google Gemini 大模型系列，API 具有独特的 native 结构（支持顶级安全控制与搜索接地）。",
                   "categories":  {
                                      "multimodal_chat":  {
                                                              "description":  "标准与预览版多模态对话模型",
                                                              "models":  [
                                                                             "Gemini 2.5 Flash",
                                                                             "Gemini 2.5 Flash-Lite",
                                                                             "Gemini 3 Flash Preview",
                                                                             "Gemini 3.1 Flash-Lite",
                                                                             "Gemini 3.5 Flash",
                                                                             "Gemini Flash Latest",
                                                                             "Gemini Flash-Lite Latest",
                                                                             "Nano Banana",
                                                                             "Nano Banana Pro",
                                                                             "Gemini 2.5 Pro",
                                                                             "Gemini 3.1 Pro Preview",
                                                                             "Gemini 3.1 Pro Preview (Custom Tools)"
                                                                         ],
                                                              "modifiable_parameters":  {
                                                                                            "generationConfig.temperature":  {
                                                                                                                                 "type":  "float",
                                                                                                                                 "range":  "0.0 - 2.0",
                                                                                                                                 "default":  1,
                                                                                                                                 "description":  "随机性控制，值越高发散度越高。部分专业模型默认值为0.2。"
                                                                                                                             },
                                                                                            "generationConfig.topP":  {
                                                                                                                          "type":  "float",
                                                                                                                          "range":  "0.0 - 1.0",
                                                                                                                          "default":  0.95,
                                                                                                                          "description":  "核采样。控制累积采样概率。"
                                                                                                                      },
                                                                                            "generationConfig.topK":  {
                                                                                                                          "type":  "integer",
                                                                                                                          "range":  "1 - 40",
                                                                                                                          "default":  40,
                                                                                                                          "description":  "K值采样。只从概率最高的前 K 个词中进行采样。"
                                                                                                                      },
                                                                                            "generationConfig.maxOutputTokens":  {
                                                                                                                                     "type":  "integer",
                                                                                                                                     "range":  "1 - 8192",
                                                                                                                                     "default":  "由模型能力决定",
                                                                                                                                     "description":  "允许生成回复的最大 Token 数。"
                                                                                                                                 },
                                                                                            "generationConfig.stopSequences":  {
                                                                                                                                   "type":  "array of strings",
                                                                                                                                   "range":  "最多5个词",
                                                                                                                                   "default":  "null",
                                                                                                                                   "description":  "停止字符序列，当模型生成这些序列时自动中断。"
                                                                                                                               },
                                                                                            "generationConfig.responseMimeType":  {
                                                                                                                                      "type":  "string",
                                                                                                                                      "range":  "text/plain, application/json, text/x.enum",
                                                                                                                                      "default":  "text/plain",
                                                                                                                                      "description":  "强制返回的 MIME 类型。设为 \u0027application/json\u0027 即开启 JSON 结构化输出。"
                                                                                                                                  },
                                                                                            "generationConfig.responseSchema":  {
                                                                                                                                    "type":  "object",
                                                                                                                                    "range":  "标准 OpenAPI 3.0 Schema 对象",
                                                                                                                                    "default":  "null",
                                                                                                                                    "description":  "与 responseMimeType 联用。传入 JSON Schema，强行约束模型生成的 JSON 格式必须百分之百符合此 Schema。"
                                                                                                                                },
                                                                                            "generationConfig.presencePenalty":  {
                                                                                                                                     "type":  "float",
                                                                                                                                     "range":  "-2.0 - 2.0",
                                                                                                                                     "default":  0,
                                                                                                                                     "description":  "存在惩罚。正值鼓励谈论新话题。"
                                                                                                                                 },
                                                                                            "generationConfig.frequencyPenalty":  {
                                                                                                                                      "type":  "float",
                                                                                                                                      "range":  "-2.0 - 2.0",
                                                                                                                                      "default":  0,
                                                                                                                                      "description":  "频率惩罚。正值防重复相同词汇。"
                                                                                                                                  },
                                                                                            "safetySettings":  {
                                                                                                                   "type":  "array of objects",
                                                                                                                   "range":  "设置 blocking 阈值",
                                                                                                                   "default":  "默认防范中等及以上敏感内容",
                                                                                                                   "description":  "可调节的安全限制。每个类别（HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT, CIVIC_INTEGRITY）可设置为: BLOCK_NONE (不拦截), BLOCK_LOW_AND_ABOVE (低敏感起拦截), BLOCK_MEDIUM_AND_ABOVE, BLOCK_ONLY_HIGH。"
                                                                                                               },
                                                                                            "tools":  {
                                                                                                          "type":  "array of objects",
                                                                                                          "range":  "支持 functionDeclarations 或 googleSearchRetrieval",
                                                                                                          "default":  "null",
                                                                                                          "description":  "包含工具集。除了定义自定义函数（Function Calling）外，还可以传首创的 {\u0027googleSearch\u0027: {}}，让模型无缝对接谷歌实时搜索联网检索！"
                                                                                                      },
                                                                                            "toolConfig.functionCallingConfig.mode":  {
                                                                                                                                          "type":  "string",
                                                                                                                                          "range":  "AUTO, ANY, NONE",
                                                                                                                                          "default":  "AUTO",
                                                                                                                                          "description":  "控制函数调用的强制程度。AUTO（由模型决定是否调），ANY（强制必须调某个函数），NONE（禁用函数调用）。"
                                                                                                                                      }
                                                                                        },
                                                              "free_models":  [
                                                                                  "Gemini 2.5 Flash",
                                                                                  "Gemini 2.5 Flash-Lite",
                                                                                  "Gemini 3 Flash Preview",
                                                                                  "Gemini 3.1 Flash-Lite",
                                                                                  "Gemini 3.5 Flash",
                                                                                  "Gemini Flash Latest",
                                                                                  "Gemini Flash-Lite Latest",
                                                                                  "Nano Banana",
                                                                                  "Nano Banana Pro"
                                                                              ]
                                                          },
                                      "embedding":  {
                                                        "description":  "文本向量模型",
                                                        "models":  [
                                                                       "gemini-embedding-001",
                                                                       "gemini-embedding-2-preview"
                                                                   ],
                                                        "modifiable_parameters":  {
                                                                                      "content":  {
                                                                                                      "type":  "string 或 array",
                                                                                                      "range":  "文本内容",
                                                                                                      "default":  "必填项",
                                                                                                      "description":  "需要向量化的目标文本。"
                                                                                                  },
                                                                                      "taskType":  {
                                                                                                       "type":  "string",
                                                                                                       "range":  "RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING",
                                                                                                       "default":  "RETRIEVAL_QUERY",
                                                                                                       "description":  "嵌入的任务类型，根据使用场景微调向量生成方向。"
                                                                                                   },
                                                                                      "title":  {
                                                                                                    "type":  "string",
                                                                                                    "range":  "文档标题",
                                                                                                    "default":  "null",
                                                                                                    "description":  "仅在 taskType 为 RETRIEVAL_DOCUMENT 时有效，用于标记被嵌入文本的标题。"
                                                                                                },
                                                                                      "outputDimensionality":  {
                                                                                                                   "type":  "integer",
                                                                                                                   "range":  "仅 gemini-embedding-2-preview 支持截断",
                                                                                                                   "default":  "默认全维度",
                                                                                                                   "description":  "指定向量的最终维度大小，通过降低维度来减少数据库存储负载。"
                                                                                                               }
                                                                                  },
                                                        "free_models":  [

                                                                        ]
                                                    }
                                  }
               },
    "openai":  {
                   "description":  "OpenAI 官方大模型 API，全行业标准的参数定义者。",
                   "categories":  {
                                      "standard_chat":  {
                                                            "description":  "标准/多模态对话大模型 (GPT-4o, GPT-4, GPT-3.5 系列等)",
                                                            "models":  [
                                                                           "chatgpt-4o-latest",
                                                                           "gpt-3.5-turbo",
                                                                           "gpt-3.5-turbo-0125",
                                                                           "gpt-3.5-turbo-1106",
                                                                           "gpt-3.5-turbo-16k",
                                                                           "gpt-4-0125-preview",
                                                                           "gpt-4-1106-preview",
                                                                           "gpt-4-turbo",
                                                                           "gpt-4-turbo-2024-04-09",
                                                                           "gpt-4-turbo-preview",
                                                                           "gpt-4.1",
                                                                           "gpt-4.1-mini-2025-04-14",
                                                                           "gpt-4.1-nano",
                                                                           "gpt-4.1-nano-2025-04-14",
                                                                           "gpt-4o-mini",
                                                                           "gpt-4o-mini-2024-07-18",
                                                                           "gpt-5",
                                                                           "gpt-5-2025-08-07",
                                                                           "gpt-5-chat-latest",
                                                                           "gpt-5-mini",
                                                                           "gpt-5-mini-2025-08-07",
                                                                           "gpt-5-nano",
                                                                           "gpt-5-nano-2025-08-07",
                                                                           "gpt-5.1",
                                                                           "gpt-5.2",
                                                                           "gpt-5.4",
                                                                           "gpt-5.4-mini",
                                                                           "gpt-5.5"
                                                                       ],
                                                            "modifiable_parameters":  {
                                                                                          "temperature":  {
                                                                                                              "type":  "float",
                                                                                                              "range":  "0.0 - 2.0",
                                                                                                              "default":  1,
                                                                                                              "description":  "温度。值越高生成越多样/创意。设为0则完全确定。"
                                                                                                          },
                                                                                          "top_p":  {
                                                                                                        "type":  "float",
                                                                                                        "range":  "0.0 - 1.0",
                                                                                                        "default":  1,
                                                                                                        "description":  "核采样。控制从累计概率前P的词中采样。"
                                                                                                    },
                                                                                          "max_tokens":  {
                                                                                                             "type":  "integer",
                                                                                                             "range":  "1 - 16384 (随模型而变)",
                                                                                                             "default":  "null",
                                                                                                             "description":  "最大输出Token数。"
                                                                                                         },
                                                                                          "presence_penalty":  {
                                                                                                                   "type":  "float",
                                                                                                                   "range":  "-2.0 - 2.0",
                                                                                                                   "default":  0,
                                                                                                                   "description":  "存在惩罚。正值鼓励模型发掘全新话题。"
                                                                                                               },
                                                                                          "frequency_penalty":  {
                                                                                                                    "type":  "float",
                                                                                                                    "range":  "-2.0 - 2.0",
                                                                                                                    "default":  0,
                                                                                                                    "description":  "频率惩罚。正值防模型重复使用同一句式。"
                                                                                                                },
                                                                                          "logit_bias":  {
                                                                                                             "type":  "map of int to float",
                                                                                                             "range":  "键为TokenID，值为 -100 到 100",
                                                                                                             "default":  "null",
                                                                                                             "description":  "修改特定Token在输出中出现的概率。-100表示彻底禁用。"
                                                                                                         },
                                                                                          "logprobs":  {
                                                                                                           "type":  "boolean",
                                                                                                           "range":  "true/false",
                                                                                                           "default":  "false",
                                                                                                           "description":  "是否返回生成过程中概率最高的Token的对数概率。"
                                                                                                       },
                                                                                          "top_logprobs":  {
                                                                                                               "type":  "integer",
                                                                                                               "range":  "0 - 20",
                                                                                                               "default":  "null",
                                                                                                               "description":  "若 logprobs 设为 true，需要返回的概率最高的Token数量。"
                                                                                                           },
                                                                                          "stop":  {
                                                                                                       "type":  "string 或 array of strings",
                                                                                                       "range":  "最多4个词",
                                                                                                       "default":  "null",
                                                                                                       "description":  "停止词。"
                                                                                                   },
                                                                                          "stream":  {
                                                                                                         "type":  "boolean",
                                                                                                         "range":  "true/false",
                                                                                                         "default":  "false",
                                                                                                         "description":  "流式返回模式。"
                                                                                                     },
                                                                                          "stream_options":  {
                                                                                                                 "type":  "object",
                                                                                                                 "range":  "{\"include_usage\": true}",
                                                                                                                 "default":  "null",
                                                                                                                 "description":  "流式输出时的选项，例如开启 include_usage 可以在流的最后输出用量统计。"
                                                                                                             },
                                                                                          "seed":  {
                                                                                                       "type":  "integer",
                                                                                                       "range":  "任意整数",
                                                                                                       "default":  "null",
                                                                                                       "description":  "随机种子。相同种子在相同环境下可让生成结果重现。"
                                                                                                   },
                                                                                          "response_format":  {
                                                                                                                  "type":  "object",
                                                                                                                  "range":  "{\"type\": \"text\"} 或 {\"type\": \"json_object\"} 或 {\"type\": \"json_schema\", ...}",
                                                                                                                  "default":  "null",
                                                                                                                  "description":  "强制响应格式。最先进的 Structured Outputs 技术可以通过 json_schema 参数百分百约束输出结构。"
                                                                                                              },
                                                                                          "tools":  {
                                                                                                        "type":  "array of objects",
                                                                                                        "range":  "工具函数声明",
                                                                                                        "default":  "null",
                                                                                                        "description":  "函数调用工具集。"
                                                                                                    },
                                                                                          "tool_choice":  {
                                                                                                              "type":  "string/object",
                                                                                                              "range":  "none, auto, required 或指定具体函数",
                                                                                                              "default":  "auto",
                                                                                                              "description":  "工具选择模式。"
                                                                                                          },
                                                                                          "parallel_tool_calls":  {
                                                                                                                      "type":  "boolean",
                                                                                                                      "range":  "true/false",
                                                                                                                      "default":  "true",
                                                                                                                      "description":  "是否允许在一次请求中并行调用多个函数工具。"
                                                                                                                  },
                                                                                          "user":  {
                                                                                                       "type":  "string",
                                                                                                       "range":  "终端用户标识",
                                                                                                       "default":  "null",
                                                                                                       "description":  "提供给OpenAI的终端用户ID，帮助检测滥用。"
                                                                                                   }
                                                                                      },
                                                            "free_models":  [

                                                                            ]
                                                        },
                                      "audio_integrated_chat":  {
                                                                    "description":  "原生音频输入输出双向对话模型 (GPT-4o Audio 系列)",
                                                                    "models":  [
                                                                                   "gpt-4o-audio-preview",
                                                                                   "gpt-4o-audio-preview-2025-06-03"
                                                                               ],
                                                                    "modifiable_parameters":  {
                                                                                                  "modalities":  {
                                                                                                                     "type":  "array of strings",
                                                                                                                     "range":  "[\"text\", \"audio\"] 或 [\"text\"]",
                                                                                                                     "default":  "[\"text\"]",
                                                                                                                     "description":  "指定模型输出的媒体形式。若需要模型直接发出合成人声，应传入 [\u0027text\u0027, \u0027audio\u0027]。"
                                                                                                                 },
                                                                                                  "audio.voice":  {
                                                                                                                      "type":  "string",
                                                                                                                      "range":  "alloy, echo, fable, onyx, nova, shimmer",
                                                                                                                      "default":  "alloy",
                                                                                                                      "description":  "指定模型直接发出音频流回复时的配音音色。"
                                                                                                                  },
                                                                                                  "audio.format":  {
                                                                                                                       "type":  "string",
                                                                                                                       "range":  "wav, mp3, flac, opus",
                                                                                                                       "default":  "wav",
                                                                                                                       "description":  "返回人声的音频编码格式。"
                                                                                                                   },
                                                                                                  "temperature":  {
                                                                                                                      "type":  "float",
                                                                                                                      "range":  "0.0 - 2.0",
                                                                                                                      "default":  1,
                                                                                                                      "description":  "温度参数。"
                                                                                                                  },
                                                                                                  "max_tokens":  {
                                                                                                                     "type":  "integer",
                                                                                                                     "range":  "1 - 8192",
                                                                                                                     "default":  "null",
                                                                                                                     "description":  "最大总生成Token数。"
                                                                                                                 }
                                                                                              },
                                                                    "free_models":  [

                                                                                    ]
                                                                },
                                      "reasoning_chat":  {
                                                             "description":  "思维/强化推理型大模型 (o3-mini 系列)",
                                                             "models":  [
                                                                            "o3-mini",
                                                                            "o3-mini-2025-01-31"
                                                                        ],
                                                             "modifiable_parameters":  {
                                                                                           "reasoning_effort":  {
                                                                                                                    "type":  "string",
                                                                                                                    "range":  "low, medium, high",
                                                                                                                    "default":  "medium",
                                                                                                                    "description":  "OpenAI推理模型专有参数。控制模型分配的内部思考深度/时间。值越高，模型解难题能力越强，但时延和成本增加。"
                                                                                                                },
                                                                                           "max_completion_tokens":  {
                                                                                                                         "type":  "integer",
                                                                                                                         "range":  "1 - 65536",
                                                                                                                         "default":  "None",
                                                                                                                         "description":  "OpenAI推理模型替代 max_tokens 的专有参数。必须把 max_completion_tokens 设得足够大，因为它同时包含了模型内部未显示出来的\u0027思考用Token\u0027 (Reasoning Tokens) 以及最终输出的内容Token。"
                                                                                                                     },
                                                                                           "stop":  {
                                                                                                        "type":  "string/array",
                                                                                                        "range":  "停止词",
                                                                                                        "default":  "null",
                                                                                                        "description":  "停止词列表。"
                                                                                                    },
                                                                                           "response_format":  {
                                                                                                                   "type":  "object",
                                                                                                                   "range":  "JSON Mode 或 Structured Outputs",
                                                                                                                   "default":  "null",
                                                                                                                   "description":  "支持结构化输出。"
                                                                                                               },
                                                                                           "tools":  {
                                                                                                         "type":  "array",
                                                                                                         "range":  "函数工具集",
                                                                                                         "default":  "null",
                                                                                                         "description":  "支持函数调用。"
                                                                                                     },
                                                                                           "tool_choice":  {
                                                                                                               "type":  "string/object",
                                                                                                               "range":  "none, auto, required",
                                                                                                               "default":  "auto",
                                                                                                               "description":  "工具调用选择。"
                                                                                                           },
                                                                                           "user":  {
                                                                                                        "type":  "string",
                                                                                                        "range":  "唯一字符串",
                                                                                                        "default":  "null",
                                                                                                        "description":  "终端用户标识。"
                                                                                                    },
                                                                                           "__restrict_note":  {
                                                                                                                   "type":  "CRITICAL LIMITATION",
                                                                                                                   "range":  "参数禁用",
                                                                                                                   "default":  "温度/核采样惩罚强制锁定",
                                                                                                                   "description":  "注意：推理模型暂不支持修改 temperature (固定为1.0), top_p (固定为1.0), presence_penalty (固定为0.0), frequency_penalty (固定为0.0) 和 logit_bias。传入非默认值会直接报错。"
                                                                                                               }
                                                                                       },
                                                             "free_models":  [

                                                                             ]
                                                         },
                                      "text_completion_legacy":  {
                                                                     "description":  "非Chat结构的标准前向文本补全模型（遗留模型）",
                                                                     "models":  [
                                                                                    "gpt-3.5-turbo-instruct"
                                                                                ],
                                                                     "modifiable_parameters":  {
                                                                                                   "prompt":  {
                                                                                                                  "type":  "string 或 array of strings",
                                                                                                                  "range":  "纯文本提示词",
                                                                                                                  "default":  "必填项",
                                                                                                                  "description":  "需要模型接龙续写的基础上下文。"
                                                                                                              },
                                                                                                   "max_tokens":  {
                                                                                                                      "type":  "integer",
                                                                                                                      "range":  "1 - 4096",
                                                                                                                      "default":  16,
                                                                                                                      "description":  "最大输出Token数。"
                                                                                                                  },
                                                                                                   "temperature":  {
                                                                                                                       "type":  "float",
                                                                                                                       "range":  "0.0 - 2.0",
                                                                                                                       "default":  1,
                                                                                                                       "description":  "随机性温度。"
                                                                                                                   },
                                                                                                   "top_p":  {
                                                                                                                 "type":  "float",
                                                                                                                 "range":  "0.0 - 1.0",
                                                                                                                 "default":  1,
                                                                                                                 "description":  "核采样。"
                                                                                                             },
                                                                                                   "stop":  {
                                                                                                                "type":  "string/array",
                                                                                                                "range":  "停止序列",
                                                                                                                "default":  "null",
                                                                                                                "description":  "生成截止标志。"
                                                                                                            },
                                                                                                   "suffix":  {
                                                                                                                  "type":  "string",
                                                                                                                  "range":  "纯文本",
                                                                                                                  "default":  "null",
                                                                                                                  "description":  "模型在生成完成后需要无缝插入在其后的后缀文本。"
                                                                                                              },
                                                                                                   "echo":  {
                                                                                                                "type":  "boolean",
                                                                                                                "range":  "true/false",
                                                                                                                "default":  "false",
                                                                                                                "description":  "是否在API回复中把最初的 prompt 重新原封不动打印一遍。"
                                                                                                            },
                                                                                                   "logprobs":  {
                                                                                                                    "type":  "integer",
                                                                                                                    "range":  "1 - 5",
                                                                                                                    "default":  "null",
                                                                                                                    "description":  "返回概率最高的前N个Token的对数概率。"
                                                                                                                },
                                                                                                   "best_of":  {
                                                                                                                   "type":  "integer",
                                                                                                                   "range":  "1 - 20",
                                                                                                                   "default":  1,
                                                                                                                   "description":  "在服务端批量生成 N 个不同的回复，只选概率最好的那一个返回。"
                                                                                                               }
                                                                                               },
                                                                     "free_models":  [

                                                                                     ]
                                                                 },
                                      "embedding":  {
                                                        "description":  "文本向量嵌入模型",
                                                        "models":  [
                                                                       "text-embedding-3-large",
                                                                       "text-embedding-3-small",
                                                                       "text-embedding-ada-002"
                                                                   ],
                                                        "modifiable_parameters":  {
                                                                                      "input":  {
                                                                                                    "type":  "string 或 array of strings/int-arrays",
                                                                                                    "range":  "目标文本",
                                                                                                    "default":  "必填项",
                                                                                                    "description":  "需要向量化的原始文本或Token编码。"
                                                                                                },
                                                                                      "dimensions":  {
                                                                                                         "type":  "integer",
                                                                                                         "range":  "仅 text-embedding-3-large (最大3072) 和 text-embedding-3-small (最大1536) 支持，ada-002不支持该参数",
                                                                                                         "default":  "最大分辨率",
                                                                                                         "description":  "指定生成的嵌入向量的维度。通过设置更低维度，OpenAI会自动利用 Matryoshka 表示法进行科学裁剪，保留原语义特征的同时大大缩减数据库负担。"
                                                                                                     },
                                                                                      "encoding_format":  {
                                                                                                              "type":  "string",
                                                                                                              "range":  "float, base64",
                                                                                                              "default":  "float",
                                                                                                              "description":  "返回向量的编码格式。若网络传输受阻可设为 \u0027base64\u0027 以压缩文本流量。"
                                                                                                          },
                                                                                      "user":  {
                                                                                                   "type":  "string",
                                                                                                   "range":  "唯一字符串",
                                                                                                   "default":  "null",
                                                                                                   "description":  "终端用户标识。"
                                                                                               }
                                                                                  },
                                                        "free_models":  [

                                                                        ]
                                                    },
                                      "tts":  {
                                                  "description":  "高保真文本转语音 (TTS) 模型",
                                                  "models":  [
                                                                 "gpt-4o-mini-tts",
                                                                 "tts-1",
                                                                 "tts-1-hd"
                                                             ],
                                                  "modifiable_parameters":  {
                                                                                "input":  {
                                                                                              "type":  "string",
                                                                                              "range":  "最大 4096 字符",
                                                                                              "default":  "必填项",
                                                                                              "description":  "要生成声音的目标文本。"
                                                                                          },
                                                                                "voice":  {
                                                                                              "type":  "string",
                                                                                              "range":  "alloy, echo, fable, onyx, nova, shimmer",
                                                                                              "default":  "必填项",
                                                                                              "description":  "用于朗读该文本的官方配音角色音色。"
                                                                                          },
                                                                                "response_format":  {
                                                                                                        "type":  "string",
                                                                                                        "range":  "mp3, opus, aac, flac, wav, pcm",
                                                                                                        "default":  "mp3",
                                                                                                        "description":  "音频输出的格式。其中 opus 最适合低延时流式传输，flac/wav 为无损，pcm 为原始音频样本。"
                                                                                                    },
                                                                                "speed":  {
                                                                                              "type":  "float",
                                                                                              "range":  "0.25 - 4.0",
                                                                                              "default":  1,
                                                                                              "description":  "声音朗读的速度倍率。"
                                                                                          }
                                                                            },
                                                  "free_models":  [

                                                                  ]
                                              },
                                      "speech_to_text":  {
                                                             "description":  "语音智能转录/听写与辅助转录系列模型",
                                                             "models":  [
                                                                            "gpt-4o-mini-transcribe",
                                                                            "gpt-4o-transcribe",
                                                                            "whisper-1"
                                                                        ],
                                                             "modifiable_parameters":  {
                                                                                           "file":  {
                                                                                                        "type":  "binary data",
                                                                                                        "range":  "最大25MB音频文件",
                                                                                                        "default":  "必填项",
                                                                                                        "description":  "要转写的音频文件实体（支持 mp3, mp4, mpeg, mpga, m4a, wav, webm）。"
                                                                                                    },
                                                                                           "prompt":  {
                                                                                                          "type":  "string",
                                                                                                          "range":  "辅助转录提示词",
                                                                                                          "default":  "null",
                                                                                                          "description":  "提供一个包含特定专业词汇、拼写习惯的短句，引导听写模型更正转写风格。"
                                                                                                      },
                                                                                           "response_format":  {
                                                                                                                   "type":  "string",
                                                                                                                   "range":  "json, verbose_json, text, vtt, srt",
                                                                                                                   "default":  "json",
                                                                                                                   "description":  "输出听写报告的形式。`verbose_json` 包含最完整的元数据和时间戳。"
                                                                                                               },
                                                                                           "temperature":  {
                                                                                                               "type":  "float",
                                                                                                               "range":  "0.0 - 1.0",
                                                                                                               "default":  0,
                                                                                                               "description":  "转录温度。强烈推荐设为0.0，否则可能导致同一语音反复生成不同结果。"
                                                                                                           },
                                                                                           "language":  {
                                                                                                            "type":  "string",
                                                                                                            "range":  "ISO-639-1 语言代码 (如 zh, en, ja)",
                                                                                                            "default":  "自动检测",
                                                                                                            "description":  "音频的主语言。手动指定可以极大加快转录速度并提高特定口音的正确度。"
                                                                                                        },
                                                                                           "timestamp_granularities":  {
                                                                                                                           "type":  "array of strings",
                                                                                                                           "range":  "[\"word\", \"segment\"]",
                                                                                                                           "default":  "[\"segment\"]",
                                                                                                                           "description":  "若 response_format 为 verbose_json，指定返回的时间戳细粒度。可选 word (词级时间戳) 和 segment (段级时间戳)。"
                                                                                                                       }
                                                                                       },
                                                             "free_models":  [

                                                                             ]
                                                         },
                                      "moderation":  {
                                                         "description":  "内容安全过滤模型",
                                                         "models":  [
                                                                        "text-moderation-stable"
                                                                    ],
                                                         "modifiable_parameters":  {
                                                                                       "input":  {
                                                                                                     "type":  "string 或 array of strings",
                                                                                                     "range":  "需要评估的文本",
                                                                                                     "default":  "必填项",
                                                                                                     "description":  "需要进行色情、暴力、自残、骚扰等11个维度安全风险评估的文本。"
                                                                                                 }
                                                                                   },
                                                         "free_models":  [
                                                                             "text-moderation-stable"
                                                                         ]
                                                     }
                                  }
               },
    "openrouter":  {
                       "description":  "OpenRouter 是一网打尽全球大语言模型的聚合 API 平台。接口完全兼容 OpenAI SDK，并支持模型智能回退（Fallback）与定制化路由机制。",
                       "categories":  {
                                          "openrouter_native":  {
                                                                    "description":  "OpenRouter 平台原生专有级请求控制参数",
                                                                    "models":  [
                                                                                   "Auto Router",
                                                                                   "Body Builder (beta)",
                                                                                   "Free Models Router",
                                                                                   "Pareto Code Router",
                                                                                   "Switchpoint Router"
                                                                               ],
                                                                    "modifiable_parameters":  {
                                                                                                  "models":  {
                                                                                                                 "type":  "array of strings",
                                                                                                                 "range":  "模型 Slug 列表 (如 [\u0027anthropic/claude-3.5-sonnet\u0027, \u0027openai/gpt-4o\u0027])",
                                                                                                                 "default":  "null",
                                                                                                                 "description":  "智能回退列表。如果主请求模型失败、超频或受限，OpenRouter 会按照此列表中的顺序自动尝试后续模型进行回退。"
                                                                                                             },
                                                                                                  "route":  {
                                                                                                                "type":  "string",
                                                                                                                "range":  "fallback",
                                                                                                                "default":  "null",
                                                                                                                "description":  "路由规则模式。设置为 \u0027fallback\u0027 时强制开启 models 数组中定义的回退机制。"
                                                                                                            },
                                                                                                  "provider":  {
                                                                                                                   "type":  "object",
                                                                                                                   "range":  "{\"order\": [...], \"allow_fallbacks\": false, \"data_collection\": \"deny\"}",
                                                                                                                   "default":  "null",
                                                                                                                   "description":  "强制指定提供商路由配置。可以控制优先级、拒绝特定的图像/数据收集节点，或者完全禁用特定 CDN。"
                                                                                                               },
                                                                                                  "transforms":  {
                                                                                                                     "type":  "array of strings",
                                                                                                                     "range":  "[\"compression\"]",
                                                                                                                     "default":  "null",
                                                                                                                     "description":  "请求变换列表。例如传入 [\u0027compression\u0027] 可开启 OpenRouter 云端轻量级 Prompt 压缩技术。"
                                                                                                                 },
                                                                                                  "top_k":  {
                                                                                                                "type":  "integer",
                                                                                                                "range":  "1 - 100",
                                                                                                                "default":  "null",
                                                                                                                "description":  "K值采样。控制采样池大小。适用于 Anthropic、Mistral 等支持 top_k 的后端模型。"
                                                                                                            },
                                                                                                  "repetition_penalty":  {
                                                                                                                             "type":  "float",
                                                                                                                             "range":  "0.0 - 2.0",
                                                                                                                             "default":  1,
                                                                                                                             "description":  "重复词惩罚。适用于 Qwen、Llama 等开源或微调模型。"
                                                                                                                         },
                                                                                                  "min_p":  {
                                                                                                                "type":  "float",
                                                                                                                "range":  "0.0 - 1.0",
                                                                                                                "default":  "null",
                                                                                                                "description":  "最小概率裁剪。剔除概率低于最大概率乘以 min_p 的所有不合理 Token，提高输出严谨度。"
                                                                                                            },
                                                                                                  "top_a":  {
                                                                                                                "type":  "float",
                                                                                                                "range":  "0.0 - 1.0",
                                                                                                                "default":  "null",
                                                                                                                "description":  "自适应 Top-A 采样。"
                                                                                                            }
                                                                                              },
                                                                    "free_models":  [

                                                                                    ]
                                                                },
                                          "reasoning_chat":  {
                                                                 "description":  "推理增强与思维链大模型 (o系列/R1/ERNIE Thinking/Kimi Thinking等)",
                                                                 "models":  [
                                                                                "LiquidAI: LFM2.5-1.2B-Thinking (free)",
                                                                                "AllenAI: Olmo 3 32B Think",
                                                                                "Arcee AI: Maestro Reasoning",
                                                                                "Arcee AI: Trinity Large Thinking",
                                                                                "Baidu: ERNIE 4.5 21B A3B Thinking",
                                                                                "DeepSeek: R1",
                                                                                "DeepSeek: R1 0528",
                                                                                "DeepSeek: R1 Distill Llama 70B",
                                                                                "DeepSeek: R1 Distill Qwen 32B",
                                                                                "MoonshotAI: Kimi K2 Thinking",
                                                                                "OpenAI: o1",
                                                                                "OpenAI: o1-pro",
                                                                                "OpenAI: o3",
                                                                                "OpenAI: o3 Deep Research",
                                                                                "OpenAI: o3 Mini",
                                                                                "OpenAI: o3 Mini High",
                                                                                "OpenAI: o3 Pro",
                                                                                "OpenAI: o4 Mini",
                                                                                "OpenAI: o4 Mini Deep Research",
                                                                                "OpenAI: o4 Mini High",
                                                                                "Qwen: Qwen Plus 0728 (thinking)",
                                                                                "Qwen: Qwen3 235B A22B Thinking 2507",
                                                                                "Qwen: Qwen3 30B A3B Thinking 2507",
                                                                                "Qwen: Qwen3 Max Thinking",
                                                                                "Qwen: Qwen3 Next 80B A3B Thinking",
                                                                                "Qwen: Qwen3 VL 235B A22B Thinking",
                                                                                "Qwen: Qwen3 VL 30B A3B Thinking",
                                                                                "Qwen: Qwen3 VL 8B Thinking",
                                                                                "Qwen: Qwen3.5 Plus 2026-04-20"
                                                                            ],
                                                                 "modifiable_parameters":  {
                                                                                               "reasoning_effort":  {
                                                                                                                        "type":  "string",
                                                                                                                        "range":  "low, medium, high",
                                                                                                                        "default":  "medium",
                                                                                                                        "description":  "仅限 OpenAI o3 系列等支持的模型。控制思考深度。"
                                                                                                                    },
                                                                                               "max_completion_tokens":  {
                                                                                                                             "type":  "integer",
                                                                                                                             "range":  "1 - 100000",
                                                                                                                             "default":  "null",
                                                                                                                             "description":  "限制最大输出，必须给足额度以包含思维链 Token。"
                                                                                                                         },
                                                                                               "temperature":  {
                                                                                                                   "type":  "float",
                                                                                                                   "range":  "0.0 - 2.0",
                                                                                                                   "default":  0.6,
                                                                                                                   "description":  "随机温度。注意：OpenAI o系列强制锁定 1.0，但 DeepSeek/ERNIE 等模型支持自由调节以控制随机度。"
                                                                                                               },
                                                                                               "top_p":  {
                                                                                                             "type":  "float",
                                                                                                             "range":  "0.0 - 1.0",
                                                                                                             "default":  0.95,
                                                                                                             "description":  "核采样。"
                                                                                                         }
                                                                                           },
                                                                 "free_models":  [
                                                                                     "LiquidAI: LFM2.5-1.2B-Thinking (free)"
                                                                                 ]
                                                             },
                                          "multimodal_vision":  {
                                                                    "description":  "多模态视觉大模型 (支持图片、文档以及视频理解)",
                                                                    "models":  [
                                                                                   "NVIDIA: Nemotron Nano 12B 2 VL (free)",
                                                                                   "Baidu: ERNIE 4.5 VL 28B A3B",
                                                                                   "Baidu: ERNIE 4.5 VL 424B A47B",
                                                                                   "Google: Gemini 2.5 Pro Preview 05-06",
                                                                                   "Google: Gemini 2.5 Pro Preview 06-05",
                                                                                   "Google: Nano Banana (Gemini 2.5 Flash Image)",
                                                                                   "Google: Nano Banana 2 (Gemini 3.1 Flash Image Preview)",
                                                                                   "Google: Nano Banana Pro (Gemini 3 Pro Image Preview)",
                                                                                   "Meta: Llama 3.2 11B Vision Instruct",
                                                                                   "Qwen: Qwen2.5 VL 72B Instruct",
                                                                                   "Qwen: Qwen3 VL 235B A22B Instruct",
                                                                                   "Qwen: Qwen3 VL 30B A3B Instruct",
                                                                                   "Qwen: Qwen3 VL 32B Instruct",
                                                                                   "Qwen: Qwen3 VL 8B Instruct",
                                                                                   "Z.ai: GLM 4.5V",
                                                                                   "Z.ai: GLM 4.6V"
                                                                               ],
                                                                    "modifiable_parameters":  {
                                                                                                  "temperature":  {
                                                                                                                      "type":  "float",
                                                                                                                      "range":  "0.0 - 2.0",
                                                                                                                      "default":  0.8,
                                                                                                                      "description":  "温度参数。"
                                                                                                                  },
                                                                                                  "top_p":  {
                                                                                                                "type":  "float",
                                                                                                                "range":  "0.0 - 1.0",
                                                                                                                "default":  0.8,
                                                                                                                "description":  "核采样。"
                                                                                                            },
                                                                                                  "max_tokens":  {
                                                                                                                     "type":  "integer",
                                                                                                                     "range":  "1 - 8192",
                                                                                                                     "default":  "null",
                                                                                                                     "description":  "最大输出Token数。"
                                                                                                                 },
                                                                                                  "stream":  {
                                                                                                                 "type":  "boolean",
                                                                                                                 "range":  "true/false",
                                                                                                                 "default":  "false",
                                                                                                                 "description":  "是否开启流式输出。"
                                                                                                             }
                                                                                              },
                                                                    "free_models":  [
                                                                                        "NVIDIA: Nemotron Nano 12B 2 VL (free)"
                                                                                    ]
                                                                },
                                          "standard_chat_premium":  {
                                                                        "description":  "旗舰级商用大语言对话模型",
                                                                        "models":  [
                                                                                       "alibaba/qwen3.7-max",
                                                                                       "Anthropic: Claude Opus 4",
                                                                                       "Anthropic: Claude Opus 4.1",
                                                                                       "Anthropic: Claude Opus 4.5",
                                                                                       "Anthropic: Claude Opus 4.6",
                                                                                       "Anthropic: Claude Opus 4.6 (Fast)",
                                                                                       "Anthropic: Claude Opus 4.7",
                                                                                       "Anthropic: Claude Opus 4.7 (Fast)",
                                                                                       "Anthropic: Claude Opus Latest",
                                                                                       "Anthropic: Claude Sonnet 4",
                                                                                       "Anthropic: Claude Sonnet 4.5",
                                                                                       "Anthropic: Claude Sonnet Latest",
                                                                                       "anthropic/claude-sonnet-4.6",
                                                                                       "Baidu: ERNIE 4.5 300B A47B",
                                                                                       "DeepSeek: DeepSeek V3",
                                                                                       "DeepSeek: DeepSeek V3 0324",
                                                                                       "DeepSeek: DeepSeek V3.1",
                                                                                       "DeepSeek: DeepSeek V3.1 Terminus",
                                                                                       "DeepSeek: DeepSeek V3.2 Exp",
                                                                                       "DeepSeek: DeepSeek V3.2 Speciale",
                                                                                       "DeepSeek: DeepSeek V4 Pro",
                                                                                       "deepseek/deepseek-v3.2",
                                                                                       "Google: Gemini Pro Latest",
                                                                                       "Mistral Large",
                                                                                       "Mistral: Mistral Large 3 2512",
                                                                                       "Nous: Hermes 3 405B Instruct",
                                                                                       "Nous: Hermes 4 405B",
                                                                                       "OpenAI: GPT Latest",
                                                                                       "OpenAI: GPT-4",
                                                                                       "OpenAI: GPT-4 Turbo",
                                                                                       "OpenAI: GPT-4.1",
                                                                                       "OpenAI: GPT-4o",
                                                                                       "OpenAI: GPT-5",
                                                                                       "OpenAI: GPT-5 Chat",
                                                                                       "OpenAI: GPT-5 Pro",
                                                                                       "OpenAI: GPT-5.1",
                                                                                       "OpenAI: GPT-5.1 Chat",
                                                                                       "OpenAI: GPT-5.1-Codex-Max",
                                                                                       "OpenAI: GPT-5.2",
                                                                                       "OpenAI: GPT-5.2 Chat",
                                                                                       "OpenAI: GPT-5.2 Pro",
                                                                                       "OpenAI: GPT-5.3 Chat",
                                                                                       "OpenAI: GPT-5.4 Pro",
                                                                                       "OpenAI: GPT-5.5",
                                                                                       "OpenAI: GPT-5.5 Pro",
                                                                                       "openai/gpt-5.4",
                                                                                       "Qwen: Qwen3 Max",
                                                                                       "Qwen: Qwen3.5 397B A17B",
                                                                                       "Qwen: Qwen3.6 Max Preview",
                                                                                       "Qwen: Qwen3.7 Max",
                                                                                       "xAI: Grok 4.20",
                                                                                       "xAI: Grok 4.20 Multi-Agent",
                                                                                       "xAI: Grok 4.3",
                                                                                       "xai/grok-4.3",
                                                                                       "Z.ai: GLM 4.5",
                                                                                       "Z.ai: GLM 5",
                                                                                       "Z.ai: GLM 5.1"
                                                                                   ],
                                                                        "modifiable_parameters":  {
                                                                                                      "temperature":  {
                                                                                                                          "type":  "float",
                                                                                                                          "range":  "0.0 - 2.0",
                                                                                                                          "default":  0.7,
                                                                                                                          "description":  "温度控制随机性。"
                                                                                                                      },
                                                                                                      "top_p":  {
                                                                                                                    "type":  "float",
                                                                                                                    "range":  "0.0 - 1.0",
                                                                                                                    "default":  0.9,
                                                                                                                    "description":  "核采样。"
                                                                                                                },
                                                                                                      "max_tokens":  {
                                                                                                                         "type":  "integer",
                                                                                                                         "range":  "1 - 8192",
                                                                                                                         "default":  "null",
                                                                                                                         "description":  "最大输出。"
                                                                                                                     },
                                                                                                      "stop":  {
                                                                                                                   "type":  "array of strings",
                                                                                                                   "range":  "最多4个词",
                                                                                                                   "default":  "null",
                                                                                                                   "description":  "停止序列。"
                                                                                                               },
                                                                                                      "stream":  {
                                                                                                                     "type":  "boolean",
                                                                                                                     "range":  "true/false",
                                                                                                                     "default":  "false",
                                                                                                                     "description":  "流式输出。"
                                                                                                                 },
                                                                                                      "response_format":  {
                                                                                                                              "type":  "object",
                                                                                                                              "range":  "JSON Mode 或 Structured Outputs",
                                                                                                                              "default":  "null",
                                                                                                                              "description":  "支持结构化输出约束。"
                                                                                                                          }
                                                                                                  },
                                                                        "free_models":  [

                                                                                        ]
                                                                    },
                                          "standard_chat_lightweight":  {
                                                                            "description":  "轻量级、开源及特定垂直对话模型",
                                                                            "models":  [
                                                                                           "DeepSeek: DeepSeek V4 Flash (free)",
                                                                                           "Google: Gemma 4 26B A4B (free)",
                                                                                           "Google: Gemma 4 31B (free)",
                                                                                           "LiquidAI: LFM2.5-1.2B-Instruct (free)",
                                                                                           "Meta: Llama 3.2 3B Instruct (free)",
                                                                                           "Meta: Llama 3.3 70B Instruct (free)",
                                                                                           "MiniMax: MiniMax M2.5 (free)",
                                                                                           "MoonshotAI: Kimi K2.6 (free)",
                                                                                           "Nous: Hermes 3 405B Instruct (free)",
                                                                                           "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
                                                                                           "NVIDIA: Nemotron 3 Nano Omni (free)",
                                                                                           "NVIDIA: Nemotron 3 Super (free)",
                                                                                           "NVIDIA: Nemotron Nano 9B V2 (free)",
                                                                                           "OpenAI: gpt-oss-120b (free)",
                                                                                           "OpenAI: gpt-oss-20b (free)",
                                                                                           "Poolside: Laguna M.1 (free)",
                                                                                           "Poolside: Laguna XS.2 (free)",
                                                                                           "Qwen: Qwen3 Coder 480B A35B (free)",
                                                                                           "Qwen: Qwen3 Next 80B A3B Instruct (free)",
                                                                                           "Venice: Uncensored (free)",
                                                                                           "Z.ai: GLM 4.5 Air (free)",
                                                                                           "AI21: Jamba Large 1.7",
                                                                                           "AionLabs: Aion-1.0",
                                                                                           "AionLabs: Aion-1.0-Mini",
                                                                                           "AionLabs: Aion-2.0",
                                                                                           "AionLabs: Aion-RP 1.0 (8B)",
                                                                                           "AlfredPros: CodeLLaMa 7B Instruct Solidity",
                                                                                           "Amazon: Nova 2 Lite",
                                                                                           "Amazon: Nova Lite 1.0",
                                                                                           "Amazon: Nova Micro 1.0",
                                                                                           "Amazon: Nova Premier 1.0",
                                                                                           "Amazon: Nova Pro 1.0",
                                                                                           "Anthropic Claude Haiku Latest",
                                                                                           "Anthropic Claude Sonnet Latest",
                                                                                           "Anthropic: Claude 3 Haiku",
                                                                                           "Anthropic: Claude 3.5 Haiku",
                                                                                           "Anthropic: Claude Haiku 4.5",
                                                                                           "Arcee AI: Coder Large",
                                                                                           "Arcee AI: Spotlight",
                                                                                           "Arcee AI: Trinity Mini",
                                                                                           "Arcee AI: Virtuoso Large",
                                                                                           "Baidu: ERNIE 4.5 21B A3B",
                                                                                           "Baidu: Qianfan-OCR-Fast",
                                                                                           "ByteDance Seed: Seed 1.6",
                                                                                           "ByteDance Seed: Seed 1.6 Flash",
                                                                                           "ByteDance Seed: Seed-2.0-Lite",
                                                                                           "ByteDance Seed: Seed-2.0-Mini",
                                                                                           "ByteDance: UI-TARS 7B",
                                                                                           "Cohere: Command A",
                                                                                           "Cohere: Command R (08-2024)",
                                                                                           "Cohere: Command R+ (08-2024)",
                                                                                           "Cohere: Command R7B (12-2024)",
                                                                                           "Deep Cogito: Cogito v2.1 671B",
                                                                                           "DeepSeek: DeepSeek V4 Flash",
                                                                                           "EssentialAI: Rnj 1 Instruct",
                                                                                           "Google Gemini Flash Latest",
                                                                                           "Google Gemini Pro Latest",
                                                                                           "Google: Gemini 2.0 Flash",
                                                                                           "Google: Gemini 2.0 Flash Lite",
                                                                                           "Google: Gemini 2.5 Flash Lite",
                                                                                           "Google: Gemini 2.5 Flash Lite Preview 09-2025",
                                                                                           "Google: Gemini 2.5 Pro",
                                                                                           "Google: Gemini 3 Flash Preview",
                                                                                           "Google: Gemini 3.1 Flash Lite",
                                                                                           "Google: Gemini 3.1 Flash Lite Preview",
                                                                                           "Google: Gemini 3.1 Pro Preview",
                                                                                           "Google: Gemini 3.1 Pro Preview Custom Tools",
                                                                                           "Google: Gemini 3.5 Flash",
                                                                                           "Google: Gemma 2 27B",
                                                                                           "Google: Gemma 3 12B",
                                                                                           "Google: Gemma 3 27B",
                                                                                           "Google: Gemma 3 4B",
                                                                                           "Google: Gemma 3n 4B",
                                                                                           "Google: Gemma 4 26B A4B",
                                                                                           "Google: Gemma 4 31B",
                                                                                           "Google: Lyria 3 Clip Preview",
                                                                                           "Google: Lyria 3 Pro Preview",
                                                                                           "google/gemini-2.5-flash",
                                                                                           "google/gemini-3-flash",
                                                                                           "IBM: Granite 4.0 Micro",
                                                                                           "IBM: Granite 4.1 8B",
                                                                                           "Inception: Mercury 2",
                                                                                           "inclusionAI: Ling-2.6-1T",
                                                                                           "inclusionAI: Ling-2.6-flash",
                                                                                           "inclusionAI: Ring-2.6-1T",
                                                                                           "Inflection: Inflection 3 Pi",
                                                                                           "Inflection: Inflection 3 Productivity",
                                                                                           "Kwaipilot: KAT-Coder-Pro V2",
                                                                                           "LiquidAI: LFM2-24B-A2B",
                                                                                           "Llama Guard 3 8B",
                                                                                           "Magnum v4 72B",
                                                                                           "Mancer: Weaver (alpha)",
                                                                                           "Meta: Llama 3 70B Instruct",
                                                                                           "Meta: Llama 3 8B Instruct",
                                                                                           "Meta: Llama 3.1 70B Instruct",
                                                                                           "Meta: Llama 3.1 8B Instruct",
                                                                                           "Meta: Llama 3.2 1B Instruct",
                                                                                           "Meta: Llama 3.2 3B Instruct",
                                                                                           "Meta: Llama 3.3 70B Instruct",
                                                                                           "Meta: Llama 4 Maverick",
                                                                                           "Meta: Llama 4 Scout",
                                                                                           "Meta: Llama Guard 4 12B",
                                                                                           "Microsoft: Phi 4",
                                                                                           "Microsoft: Phi 4 Mini Instruct",
                                                                                           "MiniMax: MiniMax M1",
                                                                                           "MiniMax: MiniMax M2",
                                                                                           "MiniMax: MiniMax M2-her",
                                                                                           "MiniMax: MiniMax M2.1",
                                                                                           "MiniMax: MiniMax M2.5",
                                                                                           "MiniMax: MiniMax M2.7",
                                                                                           "MiniMax: MiniMax-01",
                                                                                           "Mistral Large 2407",
                                                                                           "Mistral Large 2411",
                                                                                           "Mistral: Codestral 2508",
                                                                                           "Mistral: Devstral 2 2512",
                                                                                           "Mistral: Devstral Medium",
                                                                                           "Mistral: Devstral Small 1.1",
                                                                                           "Mistral: Ministral 3 14B 2512",
                                                                                           "Mistral: Ministral 3 3B 2512",
                                                                                           "Mistral: Ministral 3 8B 2512",
                                                                                           "Mistral: Mistral 7B Instruct v0.1",
                                                                                           "Mistral: Mistral Medium 3",
                                                                                           "Mistral: Mistral Medium 3.1",
                                                                                           "Mistral: Mistral Medium 3.5",
                                                                                           "Mistral: Mistral Nemo",
                                                                                           "Mistral: Mistral Small 3",
                                                                                           "Mistral: Mistral Small 3.1 24B",
                                                                                           "Mistral: Mistral Small 3.2 24B",
                                                                                           "Mistral: Mistral Small 4",
                                                                                           "Mistral: Mixtral 8x22B Instruct",
                                                                                           "Mistral: Pixtral Large 2411",
                                                                                           "Mistral: Saba",
                                                                                           "Mistral: Voxtral Small 24B 2507",
                                                                                           "MoonshotAI Kimi Latest",
                                                                                           "MoonshotAI: Kimi K2 0711",
                                                                                           "MoonshotAI: Kimi K2 0905",
                                                                                           "MoonshotAI: Kimi K2.5",
                                                                                           "MoonshotAI: Kimi K2.6",
                                                                                           "Morph: Morph V3 Fast",
                                                                                           "Morph: Morph V3 Large",
                                                                                           "MythoMax 13B",
                                                                                           "Nex AGI: DeepSeek V3.1 Nex N1",
                                                                                           "Nous: Hermes 3 70B Instruct",
                                                                                           "Nous: Hermes 4 70B",
                                                                                           "NousResearch: Hermes 2 Pro - Llama-3 8B",
                                                                                           "NVIDIA: Llama 3.3 Nemotron Super 49B V1.5",
                                                                                           "NVIDIA: Nemotron 3 Nano 30B A3B",
                                                                                           "NVIDIA: Nemotron 3 Super",
                                                                                           "NVIDIA: Nemotron Nano 9B V2",
                                                                                           "OpenAI GPT Latest",
                                                                                           "OpenAI GPT Mini Latest",
                                                                                           "OpenAI: GPT Audio",
                                                                                           "OpenAI: GPT Audio Mini",
                                                                                           "OpenAI: GPT Chat Latest",
                                                                                           "OpenAI: GPT-3.5 Turbo",
                                                                                           "OpenAI: GPT-3.5 Turbo (older v0613)",
                                                                                           "OpenAI: GPT-3.5 Turbo 16k",
                                                                                           "OpenAI: GPT-3.5 Turbo Instruct",
                                                                                           "OpenAI: GPT-4 (older v0314)",
                                                                                           "OpenAI: GPT-4 Turbo (older v1106)",
                                                                                           "OpenAI: GPT-4 Turbo Preview",
                                                                                           "OpenAI: GPT-4.1 Mini",
                                                                                           "OpenAI: GPT-4.1 Nano",
                                                                                           "OpenAI: GPT-4o (2024-05-13)",
                                                                                           "OpenAI: GPT-4o (2024-08-06)",
                                                                                           "OpenAI: GPT-4o (2024-11-20)",
                                                                                           "OpenAI: GPT-4o Audio",
                                                                                           "OpenAI: GPT-4o Search Preview",
                                                                                           "OpenAI: GPT-4o-mini",
                                                                                           "OpenAI: GPT-4o-mini (2024-07-18)",
                                                                                           "OpenAI: GPT-4o-mini Search Preview",
                                                                                           "OpenAI: GPT-5 Codex",
                                                                                           "OpenAI: GPT-5 Image",
                                                                                           "OpenAI: GPT-5 Image Mini",
                                                                                           "OpenAI: GPT-5 Mini",
                                                                                           "OpenAI: GPT-5 Nano",
                                                                                           "OpenAI: GPT-5.1-Codex",
                                                                                           "OpenAI: GPT-5.1-Codex-Mini",
                                                                                           "OpenAI: GPT-5.2-Codex",
                                                                                           "OpenAI: GPT-5.3-Codex",
                                                                                           "OpenAI: GPT-5.4 Image 2",
                                                                                           "OpenAI: GPT-5.4 Mini",
                                                                                           "OpenAI: GPT-5.4 Nano",
                                                                                           "OpenAI: gpt-oss-120b",
                                                                                           "OpenAI: gpt-oss-20b",
                                                                                           "OpenAI: gpt-oss-safeguard-20b",
                                                                                           "Owl Alpha",
                                                                                           "Perceptron: Perceptron Mk1",
                                                                                           "Perplexity: Sonar",
                                                                                           "Perplexity: Sonar Deep Research",
                                                                                           "Perplexity: Sonar Pro",
                                                                                           "Perplexity: Sonar Pro Search",
                                                                                           "Perplexity: Sonar Reasoning Pro",
                                                                                           "Prime Intellect: INTELLECT-3",
                                                                                           "Qwen: Qwen Plus 0728",
                                                                                           "Qwen: Qwen-Plus",
                                                                                           "Qwen: Qwen2.5 7B Instruct",
                                                                                           "Qwen: Qwen3 14B",
                                                                                           "Qwen: Qwen3 235B A22B",
                                                                                           "Qwen: Qwen3 235B A22B Instruct 2507",
                                                                                           "Qwen: Qwen3 30B A3B",
                                                                                           "Qwen: Qwen3 30B A3B Instruct 2507",
                                                                                           "Qwen: Qwen3 32B",
                                                                                           "Qwen: Qwen3 8B",
                                                                                           "Qwen: Qwen3 Coder 30B A3B Instruct",
                                                                                           "Qwen: Qwen3 Coder 480B A35B",
                                                                                           "Qwen: Qwen3 Coder Flash",
                                                                                           "Qwen: Qwen3 Coder Next",
                                                                                           "Qwen: Qwen3 Coder Plus",
                                                                                           "Qwen: Qwen3 Next 80B A3B Instruct",
                                                                                           "Qwen: Qwen3.5 Plus 2026-02-15",
                                                                                           "Qwen: Qwen3.5-122B-A10B",
                                                                                           "Qwen: Qwen3.5-27B",
                                                                                           "Qwen: Qwen3.5-35B-A3B",
                                                                                           "Qwen: Qwen3.5-9B",
                                                                                           "Qwen: Qwen3.5-Flash",
                                                                                           "Qwen: Qwen3.6 27B",
                                                                                           "Qwen: Qwen3.6 35B A3B",
                                                                                           "Qwen: Qwen3.6 Flash",
                                                                                           "Qwen: Qwen3.6 Plus",
                                                                                           "Qwen2.5 72B Instruct",
                                                                                           "Qwen2.5 Coder 32B Instruct",
                                                                                           "Reka Edge",
                                                                                           "Reka Flash 3",
                                                                                           "Relace: Relace Apply 3",
                                                                                           "Relace: Relace Search",
                                                                                           "Sao10K: Llama 3 8B Lunaris",
                                                                                           "Sao10k: Llama 3 Euryale 70B v2.1",
                                                                                           "Sao10K: Llama 3.1 70B Hanami x1",
                                                                                           "Sao10K: Llama 3.1 Euryale 70B v2.2",
                                                                                           "Sao10K: Llama 3.3 Euryale 70B",
                                                                                           "StepFun: Step 3.5 Flash",
                                                                                           "Tencent: Hunyuan A13B Instruct",
                                                                                           "Tencent: Hy3 preview",
                                                                                           "TheDrummer: Cydonia 24B V4.1",
                                                                                           "TheDrummer: ReMM SLERP 13B",
                                                                                           "TheDrummer: Rocinante 12B",
                                                                                           "TheDrummer: Skyfall 36B V2",
                                                                                           "TheDrummer: UnslopNemo 12B",
                                                                                           "Upstage: Solar Pro 3",
                                                                                           "WizardLM-2 8x22B",
                                                                                           "Writer: Palmyra X5",
                                                                                           "xAI: Grok Build 0.1",
                                                                                           "Xiaomi: MiMo-V2-Flash",
                                                                                           "Xiaomi: MiMo-V2-Omni",
                                                                                           "Xiaomi: MiMo-V2-Pro",
                                                                                           "Xiaomi: MiMo-V2.5",
                                                                                           "Xiaomi: MiMo-V2.5-Pro",
                                                                                           "Z.ai: GLM 4 32B",
                                                                                           "Z.ai: GLM 4.5 Air",
                                                                                           "Z.ai: GLM 4.6",
                                                                                           "Z.ai: GLM 4.7",
                                                                                           "Z.ai: GLM 4.7 Flash",
                                                                                           "Z.ai: GLM 5 Turbo",
                                                                                           "Z.ai: GLM 5V Turbo"
                                                                                       ],
                                                                            "modifiable_parameters":  {
                                                                                                          "temperature":  {
                                                                                                                              "type":  "float",
                                                                                                                              "range":  "0.0 - 2.0",
                                                                                                                              "default":  0.7,
                                                                                                                              "description":  "温度控制。值越高，输出结果发散性和随机性越强。"
                                                                                                                          },
                                                                                                          "top_p":  {
                                                                                                                        "type":  "float",
                                                                                                                        "range":  "0.0 - 1.0",
                                                                                                                        "default":  0.9,
                                                                                                                        "description":  "核采样累积概率。"
                                                                                                                    },
                                                                                                          "max_tokens":  {
                                                                                                                             "type":  "integer",
                                                                                                                             "range":  "1 - 8192",
                                                                                                                             "default":  "null",
                                                                                                                             "description":  "最大 Token 输出量。"
                                                                                                                         },
                                                                                                          "stop":  {
                                                                                                                       "type":  "array of strings",
                                                                                                                       "range":  "最多4个词",
                                                                                                                       "default":  "null",
                                                                                                                       "description":  "停止词。"
                                                                                                                   }
                                                                                                      },
                                                                            "free_models":  [
                                                                                                "DeepSeek: DeepSeek V4 Flash (free)",
                                                                                                "Google: Gemma 4 26B A4B (free)",
                                                                                                "Google: Gemma 4 31B (free)",
                                                                                                "LiquidAI: LFM2.5-1.2B-Instruct (free)",
                                                                                                "Meta: Llama 3.2 3B Instruct (free)",
                                                                                                "Meta: Llama 3.3 70B Instruct (free)",
                                                                                                "MiniMax: MiniMax M2.5 (free)",
                                                                                                "MoonshotAI: Kimi K2.6 (free)",
                                                                                                "Nous: Hermes 3 405B Instruct (free)",
                                                                                                "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
                                                                                                "NVIDIA: Nemotron 3 Nano Omni (free)",
                                                                                                "NVIDIA: Nemotron 3 Super (free)",
                                                                                                "NVIDIA: Nemotron Nano 9B V2 (free)",
                                                                                                "OpenAI: gpt-oss-120b (free)",
                                                                                                "OpenAI: gpt-oss-20b (free)",
                                                                                                "Poolside: Laguna M.1 (free)",
                                                                                                "Poolside: Laguna XS.2 (free)",
                                                                                                "Qwen: Qwen3 Coder 480B A35B (free)",
                                                                                                "Qwen: Qwen3 Next 80B A3B Instruct (free)",
                                                                                                "Venice: Uncensored (free)",
                                                                                                "Z.ai: GLM 4.5 Air (free)"
                                                                                            ]
                                                                        }
                                      }
                   },
    "通义千问":  {
                 "description":  "阿里巴巴通义实验室大模型服务平台 (DashScope)，支持专有的联网检索能力控制。",
                 "categories":  {
                                    "standard_chat":  {
                                                          "description":  "通义千问旗舰与商用对话大模型",
                                                          "models":  [
                                                                         "qwen-max",
                                                                         "qwen-plus",
                                                                         "qwen-turbo"
                                                                     ],
                                                          "modifiable_parameters":  {
                                                                                        "temperature":  {
                                                                                                            "type":  "float",
                                                                                                            "range":  "0.0 - 2.0",
                                                                                                            "default":  1,
                                                                                                            "description":  "温度。值越大输出越随机，设为0为完全确定。"
                                                                                                        },
                                                                                        "top_p":  {
                                                                                                      "type":  "float",
                                                                                                      "range":  "0.0 - 1.0",
                                                                                                      "default":  0.8,
                                                                                                      "description":  "核采样概率累计值。"
                                                                                                  },
                                                                                        "top_k":  {
                                                                                                      "type":  "integer",
                                                                                                      "range":  "1 - 100",
                                                                                                      "default":  "null",
                                                                                                      "description":  "从候选的 top_k 个 Token 中进行采样。"
                                                                                                  },
                                                                                        "max_tokens":  {
                                                                                                           "type":  "integer",
                                                                                                           "range":  "1 - 8192",
                                                                                                           "default":  "null",
                                                                                                           "description":  "最大输出限制数。"
                                                                                                       },
                                                                                        "stop":  {
                                                                                                     "type":  "array of strings",
                                                                                                     "range":  "最多4个词",
                                                                                                     "default":  "null",
                                                                                                     "description":  "停止词列表。"
                                                                                                 },
                                                                                        "seed":  {
                                                                                                     "type":  "unsigned 64-bit int",
                                                                                                     "range":  "任意正整数",
                                                                                                     "default":  "null",
                                                                                                     "description":  "随机数生成器种子，可令生成结果复现。"
                                                                                                 },
                                                                                        "enable_search":  {
                                                                                                              "type":  "boolean",
                                                                                                              "range":  "true/false",
                                                                                                              "default":  "false",
                                                                                                              "description":  "通义千问专属联网检索开关。设置为 true 即可自动开启联网搜索，让回答具有实时性！"
                                                                                                          },
                                                                                        "search_options":  {
                                                                                                               "type":  "object",
                                                                                                               "range":  "{\"enable_source\": true}",
                                                                                                               "default":  "null",
                                                                                                               "description":  "联网搜索配置项。可控制是否在回复中带上引用的信源 URL。"
                                                                                                           }
                                                                                    },
                                                          "free_models":  [

                                                                          ]
                                                      },
                                    "open_source_chat":  {
                                                             "description":  "通义千问开源系列对话大模型",
                                                             "models":  [
                                                                            "qwen2.5-0.5b-instruct",
                                                                            "qwen2.5-1.5b-instruct",
                                                                            "qwen2.5-14b-instruct",
                                                                            "qwen2.5-32b-instruct",
                                                                            "qwen2.5-3b-instruct",
                                                                            "qwen2.5-72b-instruct",
                                                                            "qwen2.5-7b-instruct",
                                                                            "qwen2.5-coder-32b-instruct",
                                                                            "qwen2.5-coder-7b-instruct",
                                                                            "qwen2.5-math-72b-instruct",
                                                                            "qwen2.5-math-7b-instruct"
                                                                        ],
                                                             "modifiable_parameters":  {
                                                                                           "temperature":  {
                                                                                                               "type":  "float",
                                                                                                               "range":  "0.0 - 2.0",
                                                                                                               "default":  0.7,
                                                                                                               "description":  "随机性控制。"
                                                                                                           },
                                                                                           "top_p":  {
                                                                                                         "type":  "float",
                                                                                                         "range":  "0.0 - 1.0",
                                                                                                         "default":  0.8,
                                                                                                         "description":  "核采样。"
                                                                                                     },
                                                                                           "max_tokens":  {
                                                                                                              "type":  "integer",
                                                                                                              "range":  "1 - 8192",
                                                                                                              "default":  "null",
                                                                                                              "description":  "最大 Token。"
                                                                                                          },
                                                                                           "stop":  {
                                                                                                        "type":  "array of strings",
                                                                                                        "range":  "最多4个词",
                                                                                                        "default":  "null",
                                                                                                        "description":  "停止词。"
                                                                                                    },
                                                                                           "seed":  {
                                                                                                        "type":  "unsigned 64-bit int",
                                                                                                        "range":  "正整数",
                                                                                                        "default":  "null",
                                                                                                        "description":  "随机种子。"
                                                                                                    }
                                                                                       },
                                                             "free_models":  [

                                                                             ]
                                                         },
                                    "vision_chat":  {
                                                        "description":  "视觉多模态大语言模型",
                                                        "models":  [
                                                                       "qwen-vl-max",
                                                                       "qwen-vl-plus",
                                                                       "qwen2.5-vl-72b-instruct",
                                                                       "qwen2.5-vl-7b-instruct"
                                                                   ],
                                                        "modifiable_parameters":  {
                                                                                      "temperature":  {
                                                                                                          "type":  "float",
                                                                                                          "range":  "0.0 - 2.0",
                                                                                                          "default":  1,
                                                                                                          "description":  "随机性控制。"
                                                                                                      },
                                                                                      "top_p":  {
                                                                                                    "type":  "float",
                                                                                                    "range":  "0.0 - 1.0",
                                                                                                    "default":  0.8,
                                                                                                    "description":  "核采样。"
                                                                                                },
                                                                                      "max_tokens":  {
                                                                                                         "type":  "integer",
                                                                                                         "range":  "1 - 4096",
                                                                                                         "default":  "null",
                                                                                                         "description":  "最大 Token。"
                                                                                                     },
                                                                                      "stream":  {
                                                                                                     "type":  "boolean",
                                                                                                     "range":  "true/false",
                                                                                                     "default":  "false",
                                                                                                     "description":  "是否流式返回。"
                                                                                                 }
                                                                                  },
                                                        "free_models":  [

                                                                        ]
                                                    },
                                    "embedding":  {
                                                      "description":  "文本向量表示模型",
                                                      "models":  [
                                                                     "text-embedding-v1",
                                                                     "text-embedding-v2",
                                                                     "text-embedding-v3"
                                                                 ],
                                                      "modifiable_parameters":  {
                                                                                    "input":  {
                                                                                                  "type":  "string 或 array of strings",
                                                                                                  "range":  "目标文本",
                                                                                                  "default":  "必填项",
                                                                                                  "description":  "需要转换为稠密向量的目标文本。"
                                                                                              },
                                                                                    "dimensions":  {
                                                                                                       "type":  "integer",
                                                                                                       "range":  "仅 v3 支持 1 - 1536 裁剪",
                                                                                                       "default":  "1536",
                                                                                                       "description":  "向量表示维度，可根据数据库大小裁剪维度。"
                                                                                                   }
                                                                                },
                                                      "free_models":  [

                                                                      ]
                                                  }
                                }
             },
    "深度求索":  {
                 "description":  "深度求索 (DeepSeek) 官方高速推理通道。API 完全兼容 OpenAI。",
                 "categories":  {
                                    "standard_chat":  {
                                                          "description":  "DeepSeek-V3 旗舰通用对话大语言模型",
                                                          "models":  [
                                                                         "deepseek-chat"
                                                                     ],
                                                          "modifiable_parameters":  {
                                                                                        "temperature":  {
                                                                                                            "type":  "float",
                                                                                                            "range":  "0.0 - 2.0",
                                                                                                            "default":  1,
                                                                                                            "description":  "随机性温度。对于代码生成或数学推导，官方强烈建议设为 0.0。"
                                                                                                        },
                                                                                        "top_p":  {
                                                                                                      "type":  "float",
                                                                                                      "range":  "0.0 - 1.0",
                                                                                                      "default":  1,
                                                                                                      "description":  "核采样概率累计值。"
                                                                                                  },
                                                                                        "max_tokens":  {
                                                                                                           "type":  "integer",
                                                                                                           "range":  "1 - 8192",
                                                                                                           "default":  "4096",
                                                                                                           "description":  "单次生成的回复最大 Token 数量。"
                                                                                                       },
                                                                                        "presence_penalty":  {
                                                                                                                 "type":  "float",
                                                                                                                 "range":  "-2.0 - 2.0",
                                                                                                                 "default":  0,
                                                                                                                 "description":  "存在惩罚。正值鼓励引入新话题。"
                                                                                                             },
                                                                                        "frequency_penalty":  {
                                                                                                                  "type":  "float",
                                                                                                                  "range":  "-2.0 - 2.0",
                                                                                                                  "default":  0,
                                                                                                                  "description":  "频率惩罚。正值抑制模型重复相同词句。"
                                                                                                              },
                                                                                        "stop":  {
                                                                                                     "type":  "array of strings",
                                                                                                     "range":  "最多16个词",
                                                                                                     "default":  "null",
                                                                                                     "description":  "DeepSeek 特色。支持多达 16 个停止词设定，达到任何一个都自动停止生成！"
                                                                                                 },
                                                                                        "stream":  {
                                                                                                       "type":  "boolean",
                                                                                                       "range":  "true/false",
                                                                                                       "default":  "false",
                                                                                                       "description":  "开启流式。"
                                                                                                   },
                                                                                        "response_format":  {
                                                                                                                "type":  "object",
                                                                                                                "range":  "{\"type\": \"json_object\"}",
                                                                                                                "default":  "null",
                                                                                                                "description":  "设置为 JSON 模式，强制模型生成有效 JSON 对象。"
                                                                                                            }
                                                                                    },
                                                          "free_models":  [

                                                                          ]
                                                      },
                                    "reasoning_chat":  {
                                                           "description":  "DeepSeek-R1 强化推理/思维大语言模型",
                                                           "models":  [
                                                                          "deepseek-reasoner"
                                                                      ],
                                                           "modifiable_parameters":  {
                                                                                         "max_tokens":  {
                                                                                                            "type":  "integer",
                                                                                                            "range":  "1 - 8192",
                                                                                                            "default":  "4096",
                                                                                                            "description":  "最大总输出 Token 限制（包含未显示的内部推理 Token 和最终正文 Token）。请务必给得足够宽裕！"
                                                                                                        },
                                                                                         "stop":  {
                                                                                                      "type":  "array of strings",
                                                                                                      "range":  "最多16个词",
                                                                                                      "default":  "null",
                                                                                                      "description":  "停止词列表。"
                                                                                                  },
                                                                                         "stream":  {
                                                                                                        "type":  "boolean",
                                                                                                        "range":  "true/false",
                                                                                                        "default":  "false",
                                                                                                        "description":  "开启流式后，会同时以流的形式返回 reasoning_content (推理思考内容) 与 content (最终内容)。"
                                                                                                    },
                                                                                         "__restrict_note":  {
                                                                                                                 "type":  "CRITICAL LIMITATION",
                                                                                                                 "range":  "参数禁用",
                                                                                                                 "default":  "采样随机参数锁定",
                                                                                                                 "description":  "注意：DeepSeek-Reasoner 强化推理模型暂不支持温度 (temperature)、核采样 (top_p)、存在惩罚、频率惩罚及 logit_bias。如果传入这些参数的非默认值，官方网关会直接返回验证报错！"
                                                                                                             }
                                                                                     },
                                                           "free_models":  [

                                                                           ]
                                                       }
                                }
             },
    "cerebras":  {
                     "description":  "Cerebras Inference Wafer-Scale 高性能晶圆云推理引擎，支持 OpenAI 兼容的高速推理接口。",
                     "categories":  {
                                        "standard_chat":  {
                                                              "description":  "托管于 CS-3 晶圆系统的高速大模型",
                                                              "models":  [
                                                                             "gpt-oss-120b",
                                                                             "llama-3.3-70b",
                                                                             "llama-4-scout-17b-16e-instruct",
                                                                             "llama3.1-70b",
                                                                             "llama3.1-8b",
                                                                             "zai-glm-4.7"
                                                                         ],
                                                              "modifiable_parameters":  {
                                                                                            "temperature":  {
                                                                                                                "type":  "float",
                                                                                                                "range":  "0.0 - 2.0",
                                                                                                                "default":  0.7,
                                                                                                                "description":  "随机性控制。"
                                                                                                            },
                                                                                            "top_p":  {
                                                                                                          "type":  "float",
                                                                                                          "range":  "0.0 - 1.0",
                                                                                                          "default":  0.9,
                                                                                                          "description":  "核采样。"
                                                                                                      },
                                                                                            "max_completion_tokens":  {
                                                                                                                          "type":  "integer",
                                                                                                                          "range":  "1 - 40960",
                                                                                                                          "default":  "null",
                                                                                                                          "description":  "Cerebras 专有。取代 max_tokens 参数，支持极大规模（多达 40960）的超长单次内容生成！"
                                                                                                                      },
                                                                                            "seed":  {
                                                                                                         "type":  "integer",
                                                                                                         "range":  "任意整数",
                                                                                                         "default":  "null",
                                                                                                         "description":  "随机种子。"
                                                                                                     },
                                                                                            "stop":  {
                                                                                                         "type":  "array of strings",
                                                                                                         "range":  "最多4个词",
                                                                                                         "default":  "null",
                                                                                                         "description":  "停止词列表。"
                                                                                                     },
                                                                                            "stream":  {
                                                                                                           "type":  "boolean",
                                                                                                           "range":  "true/false",
                                                                                                           "default":  "false",
                                                                                                           "description":  "流式输出开关。"
                                                                                                       },
                                                                                            "presence_penalty":  {
                                                                                                                     "type":  "float",
                                                                                                                     "range":  "-2.0 - 2.0",
                                                                                                                     "default":  0,
                                                                                                                     "description":  "存在惩罚。"
                                                                                                                 },
                                                                                            "frequency_penalty":  {
                                                                                                                      "type":  "float",
                                                                                                                      "range":  "-2.0 - 2.0",
                                                                                                                      "default":  0,
                                                                                                                      "description":  "频率惩罚。"
                                                                                                                  }
                                                                                        },
                                                              "free_models":  [
                                                                                  "gpt-oss-120b",
                                                                                  "llama-3.3-70b",
                                                                                  "llama-4-scout-17b-16e-instruct",
                                                                                  "llama3.1-70b",
                                                                                  "llama3.1-8b",
                                                                                  "zai-glm-4.7"
                                                                              ]
                                                          }
                                    }
                 },
    "cloudflare":  {
                       "description":  "Cloudflare Workers AI 边缘计算无服务器模型服务，支持边缘部署的多品类大模型。",
                       "categories":  {
                                          "standard_chat":  {
                                                                "description":  "托管于 Cloudflare 网络边缘的主流对话大模型",
                                                                "models":  [
                                                                               "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
                                                                               "@cf/google/gemma-7b-it",
                                                                               "@cf/meta/llama-3-8b-instruct",
                                                                               "@cf/meta/llama-3.1-8b-instruct",
                                                                               "@cf/meta/llama-3.2-3b-instruct",
                                                                               "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                                                                               "@cf/qwen/qwen1.5-14b-chat"
                                                                           ],
                                                                "modifiable_parameters":  {
                                                                                              "temperature":  {
                                                                                                                  "type":  "float",
                                                                                                                  "range":  "0.0 - 1.0",
                                                                                                                  "default":  0.6,
                                                                                                                  "description":  "温度控制。值越高越发散。"
                                                                                                              },
                                                                                              "top_p":  {
                                                                                                            "type":  "float",
                                                                                                            "range":  "0.0 - 1.0",
                                                                                                            "default":  0.9,
                                                                                                            "description":  "核采样累积概率。"
                                                                                                        },
                                                                                              "top_k":  {
                                                                                                            "type":  "integer",
                                                                                                            "range":  "1 - 50",
                                                                                                            "default":  50,
                                                                                                            "description":  "从高概率前 K 个词中进行采样。"
                                                                                                        },
                                                                                              "max_tokens":  {
                                                                                                                 "type":  "integer",
                                                                                                                 "range":  "1 - 4096",
                                                                                                                 "default":  256,
                                                                                                                 "description":  "单次返回最大 Token。"
                                                                                                             },
                                                                                              "stream":  {
                                                                                                             "type":  "boolean",
                                                                                                             "range":  "true/false",
                                                                                                             "default":  "false",
                                                                                                             "description":  "流式返回。"
                                                                                                         },
                                                                                              "repetition_penalty":  {
                                                                                                                         "type":  "float",
                                                                                                                         "range":  "0.0 - 2.0",
                                                                                                                         "default":  1,
                                                                                                                         "description":  "重复惩罚项，帮助消除过度循环。"
                                                                                                                     }
                                                                                          },
                                                                "free_models":  [
                                                                                    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
                                                                                    "@cf/google/gemma-7b-it",
                                                                                    "@cf/meta/llama-3-8b-instruct",
                                                                                    "@cf/meta/llama-3.1-8b-instruct",
                                                                                    "@cf/meta/llama-3.2-3b-instruct",
                                                                                    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                                                                                    "@cf/qwen/qwen1.5-14b-chat"
                                                                                ]
                                                            },
                                          "embedding":  {
                                                            "description":  "Workers AI 开源向量嵌入模型",
                                                            "models":  [
                                                                           "@cf/baai/bge-large-en-v1.5"
                                                                       ],
                                                            "modifiable_parameters":  {
                                                                                          "text":  {
                                                                                                       "type":  "string 或 array",
                                                                                                       "range":  "传入待向量化文本",
                                                                                                       "default":  "必填项",
                                                                                                       "description":  "Cloudflare 特色。传入参数名为 text，而不是标准的 input。"
                                                                                                   }
                                                                                      },
                                                            "free_models":  [
                                                                                "@cf/baai/bge-large-en-v1.5"
                                                                            ]
                                                        },
                                          "speech_to_text":  {
                                                                 "description":  "Workers AI 音频转录模型",
                                                                 "models":  [
                                                                                "@cf/openai/whisper"
                                                                            ],
                                                                 "modifiable_parameters":  {
                                                                                               "audio":  {
                                                                                                             "type":  "array of integers / binary",
                                                                                                             "range":  "音频二进制字节流",
                                                                                                             "default":  "必填项",
                                                                                                             "description":  "传入音频二进制数据。"
                                                                                                         }
                                                                                           },
                                                                 "free_models":  [
                                                                                     "@cf/openai/whisper"
                                                                                 ]
                                                             }
                                      }
                   },
    "requesty":  {
                     "description":  "Requesty 智能聚合 API 平台，支持 300+ 主流大模型以及独家自动实时成本估算与缓存机制。",
                     "categories":  {
                                        "chat_gateway":  {
                                                             "description":  "Requesty 聚合通用 OpenAI 兼容接口",
                                                             "models":  [
                                                                            "anthropic/claude-3-5-sonnet",
                                                                            "deepseek/deepseek-chat",
                                                                            "google/gemini-2.5-flash",
                                                                            "meta/llama-3.3-70b-instruct",
                                                                            "openai/gpt-4o"
                                                                        ],
                                                             "modifiable_parameters":  {
                                                                                           "temperature":  {
                                                                                                               "type":  "float",
                                                                                                               "range":  "0.0 - 2.0",
                                                                                                               "default":  1,
                                                                                                               "description":  "温度参数。"
                                                                                                           },
                                                                                           "top_p":  {
                                                                                                         "type":  "float",
                                                                                                         "range":  "0.0 - 1.0",
                                                                                                         "default":  1,
                                                                                                         "description":  "核采样。"
                                                                                                     },
                                                                                           "max_tokens":  {
                                                                                                              "type":  "integer",
                                                                                                              "range":  "1 - 8192",
                                                                                                              "default":  "必填（某些后端必需）",
                                                                                                              "description":  "最大输出限制。"
                                                                                                          },
                                                                                           "stream":  {
                                                                                                          "type":  "boolean",
                                                                                                          "range":  "true/false",
                                                                                                          "default":  "false",
                                                                                                          "description":  "流式返回模式。"
                                                                                                      },
                                                                                           "stream_options":  {
                                                                                                                  "type":  "object",
                                                                                                                  "range":  "{\"include_usage\": true}",
                                                                                                                  "default":  "null",
                                                                                                                  "description":  "如果开启流式模式，指定是否在最后一帧中输出全套用量和 Requesty 精准计费数据。"
                                                                                                              },
                                                                                           "response_format":  {
                                                                                                                   "type":  "object",
                                                                                                                   "range":  "JSON Mode 或 Structured Outputs",
                                                                                                                   "default":  "null",
                                                                                                                   "description":  "约束输出格式。"
                                                                                                               }
                                                                                       },
                                                             "free_models":  [

                                                                             ]
                                                         }
                                    }
                 },
    "portkey":  {
                    "description":  "Portkey AI Gateway 智能路由网关。通过向 Portkey 请求发送专有自定义头，驱动云端网关实施容灾路由与高速语义缓存。",
                    "categories":  {
                                       "gateway_control":  {
                                                               "description":  "Portkey 网关特有请求头级控制参数 (传递于 Headers)",
                                                               "models":  [
                                                                              "anthropic/claude-3-5-sonnet",
                                                                              "google/gemini-2.5-flash",
                                                                              "openai/gpt-4o"
                                                                          ],
                                                               "modifiable_parameters":  {
                                                                                             "x-portkey-config":  {
                                                                                                                      "type":  "string (Header)",
                                                                                                                      "range":  "Portkey Dashboard 中的配置 ID",
                                                                                                                      "default":  "必填",
                                                                                                                      "description":  "指定路由蓝图。由 Portkey 云端控制重试、降级路由与负载均衡。"
                                                                                                                  },
                                                                                             "x-portkey-virtual-key":  {
                                                                                                                           "type":  "string (Header)",
                                                                                                                           "range":  "虚拟密钥别名",
                                                                                                                           "default":  "null",
                                                                                                                           "description":  "使用 Portkey dashboard 中配置的供应商虚拟密钥，避免泄露明文密钥。"
                                                                                                                       },
                                                                                             "x-portkey-cache":  {
                                                                                                                     "type":  "string (Header)",
                                                                                                                     "range":  "simple, semantic",
                                                                                                                     "default":  "null",
                                                                                                                     "description":  "开启缓存模式。\u0027semantic\u0027 (语义缓存) 会对逻辑语义相似的请求直接返回缓存数据，性能暴增 10 倍且零花费！"
                                                                                                                 },
                                                                                             "x-portkey-retry":  {
                                                                                                                     "type":  "string (Header)",
                                                                                                                     "range":  "{\"attempts\": 3}",
                                                                                                                     "default":  "null",
                                                                                                                     "description":  "设置自动重试机制。当底层 API 故障时自动触发请求回退或自动重试。"
                                                                                                                 }
                                                                                         },
                                                               "free_models":  [

                                                                               ]
                                                           }
                                   }
                }
};

export const DOC_PROVIDER_ALIASES = {
  groq: 'groq',
  openrouter: 'openrouter',
  openai: 'openai',
  gemini: 'gemini',
  glm: '智谱 AI',
  deepseek: '深度求索',
  qwen: '通义千问',
  cerebras: 'cerebras',
  cloudflare: 'cloudflare',
  requesty: 'requesty',
  portkey: 'portkey'
};
