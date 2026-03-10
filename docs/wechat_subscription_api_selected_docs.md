# 微信订阅号 API 指定接口文档抓取

来源站点: https://developers.weixin.qq.com/doc/subscription/api/

说明:
- 本文件按用户给定清单分组整理。
- `上传图文消息图片` 采用 `素材管理 / 永久素材` 分组下的页面。
- `素材管理`、`永久素材`、`临时素材`、`草稿管理与商品卡片`、`草稿管理`、`商品卡片`、`发布能力` 作为结构分组体现。

## 目录

- [基础接口](#基础接口)
- [openApi管理](#openApi管理)
- [素材管理/永久素材](#素材管理永久素材)
- [素材管理/临时素材](#素材管理临时素材)
- [草稿管理与商品卡片/草稿管理](#草稿管理与商品卡片草稿管理)
- [草稿管理与商品卡片/商品卡片](#草稿管理与商品卡片商品卡片)
- [发布能力](#发布能力)

## 基础接口

基础凭据与服务器通信相关接口。

### 获取接口调用凭据

- 页面标题: 获取接口调用凭据
- 接口英文名: getAccessToken
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/token
- 来源: https://developers.weixin.qq.com/doc/subscription/api/base/api_getaccesstoken.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getAccessToken

本接口用于获取获取全局唯一后台接口调用凭据（Access Token），token 有效期为 7200 秒，开发者需要进行妥善保存，使用注意事项请参考 此文档。

推荐使用 获取稳定版接口调用凭据

- 如使用 云开发，可通过 云调用 免维护 access_token 调用。
- 如使用 云托管，也可以通过 微信令牌/开放接口服务 免维护 access_token 调用。

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/token
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口不支持第三方平台调用。

#### 2. 请求参数

##### 查询参数 Query String Parameters

无

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| grant_type | string | 是 | 填写 client_credential |
| appid | string | 是 | 账号的唯一凭证，即 AppID，点此查看 如何获取Appid |
| secret | string | 是 | 唯一凭证密钥，即 AppSecret，点此查看 如何获取AppSecret |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| access_token | string | 获取到的凭证 |
| expires_in | number | 凭证有效时间，单位：秒。目前是7200秒之内的值。 |

#### 4. 注意事项

- 不同的应用类型的 Access Token 是互相隔离的，且仅支持调用应用类型的接口
- AppSecret 是账号使用后台 API 接口的密钥，请开发者妥善保管，避免因泄露造成账号被其他人冒用等风险。
- 如长期无 AppSecret 的使用需求，开发者可以使用对 AppSeceret 进行冻结，提高账号的安全性。
- AppSecret 冻结后，开发者无法使用 AppSecret 获取 Access token （接口返回错误码 40243），不影响账号基本功能的正常使用，不影响通过第三方授权调用后台接口，不影响云开发调用后台接口。
- 开发者可以随时对 AppSecret 进行解冻。

关于如何获取 Appid 和 AppSecret 信息，以及如何冻结/解冻AppSecret，请参考 此文档

#### 5. 代码示例

请求示例

```bash
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
```

返回示例

```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40002 | invalid grant_type | 不合法的凭证类型 |
| 40013 | invalid appid | 不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写 |
| 40125 | 不合法的 secret | 请检查 secret 的正确性，避免异常字符，注意大小写 |
| 40164 | 调用接口的IP地址不在白名单中 | 请在接口IP白名单中进行设置 |
| 40243 | AppSecret已被冻结，请解冻后再次调用。 | 点此查看 如何解冻AppSecret |
| 41004 | appsecret missing | 缺少 secret 参数 |
| 50004 | 禁止使用 token 接口 |  |
| 50007 | 账号已冻结 |  |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取稳定版接口调用凭据

- 页面标题: 获取稳定版接口调用凭据
- 接口英文名: getStableAccessToken
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/stable_token
- 来源: https://developers.weixin.qq.com/doc/subscription/api/base/api_getstableaccesstoken.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getStableAccessToken

本接口用于获取获取全局唯一后台接口调用凭据（Access Token），token 有效期为 7200 秒，但此接口和 getAccessToken 互相隔离，且比其更加稳定，推荐使用此接口替代。开发者需要进行妥善保存，使用注意事项请参考 此文档。

有两种调用模式:

- 普通模式， access_token 有效期内重复调用该接口不会更新 access_token，绝大部分场景下使用该模式；
- 强制刷新模式，会导致上次获取的 access_token 失效，并返回新的 access_token；

- 如使用 云开发，可通过 云调用 免维护 access_token 调用；
- 如使用 云托管，也可以通过 微信令牌/开放接口服务 免维护 access_token 调用；

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/stable_token
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口不支持第三方平台调用。

#### 2. 请求参数

##### 查询参数 Query String Parameters

无

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| grant_type | string | 是 | 填写 client_credential |
| appid | string | 是 | 账号的唯一凭证，即 AppID，点此查看 如何获取Appid |
| secret | string | 是 | 唯一凭证密钥，即 AppSecret，点此查看 如何获取AppSecret |
| force_refresh | boolean | 否 | 默认使用 false。1. force_refresh = false 时为普通调用模式，access_token 有效期内重复调用该接口不会更新 access_token；2. 当force_refresh = true 时为强制刷新模式，会导致上次获取的 access_token 失效，并返回新的 access_token |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| access_token | string | 获取到的凭证 |
| expires_in | number | 凭证有效时间，单位：秒。目前是7200秒之内的值。 |

#### 4. 注意事项

- 与 getAccessToken 获取的调用凭证完全隔离，互不影响。
- 该接口仅支持 POST 形式的调用。
- 该接口调用频率限制为 1 万次 每分钟，每天限制调用 50 万次。
- access_token 存储空间至少保留 512 字符。
- 强制刷新模式每天限用 20 次且需间隔 30 秒。
- 普通模式下平台会提前 5 分钟更新 access_token。

#### 5. 代码示例

##### 5.1 不强制刷新获取Token（不传递force_refresh，默认值为false）

请求示例

```
POST https://api.weixin.qq.com/cgi-bin/stable_token
```

```json
{
    "grant_type": "client_credential",
    "appid": "APPID",
    "secret": "APPSECRET"
}
```

返回示例

```json
{
    "access_token":"ACCESS_TOKEN",
    "expires_in":7200
}
```

##### 5.2 不强制刷新获取Token（设置force_refresh为false）:

请求示例

```json
{
    "grant_type": "client_credential",
    "appid": "APPID",
    "secret": "APPSECRET",
    "force_refresh": false
}
```

返回示例

```json
{
    "access_token":"ACCESS_TOKEN",
    "expires_in":345 // 如果仍然有效，会返回上次的 token，并给出所剩有效时间
}
```

##### 5.3 强制刷新模式，慎用，连续使用需要至少间隔30s

请求示例

```
POST https://api.weixin.qq.com/cgi-bin/stable_token
```

```json
{
    "grant_type": "client_credential",
    "appid": "APPID",
    "secret": "APPSECRET",
    "force_refresh": true
}
```

返回示例

```json
{
    "access_token":"ACCESS_TOKEN",
    "expires_in":7200
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 0 | ok | ok |
| 40002 | invalid grant_type | 不合法的凭证类型 |
| 40013 | invalid appid | 不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写 |
| 40125 | invalid appsecret | 无效的appsecret，请检查appsecret的正确性 |
| 40164 | invalid ip not in whitelist | 将ip添加到ip白名单列表即可 |
| 41002 | appid missing | 缺少 appid 参数 |
| 41004 | appsecret missing | 缺少 secret 参数 |
| 43002 | require POST method | 需要 POST 请求 |
| 45009 | reach max api daily quota limit | 调用超过天级别频率限制。可调用clear_quota接口恢复调用额度。 |
| 45011 | api minute-quota reach limit mustslower retry next minute | API 调用太频繁，请稍候再试 |
| 89503 | 此次调用需要管理员确认，请耐心等候 |  |
| 89506 | 该IP调用求请求已被公众号管理员拒绝，请24小时后再试，建议调用前与管理员沟通确认 |  |
| 89507 | 该IP调用求请求已被公众号管理员拒绝，请1小时后再试，建议调用前与管理员沟通确认 |  |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 网络通信检测

- 页面标题: 网络通信检测
- 接口英文名: callbackCheck
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/callback/check?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/base/api_callbackcheck.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：callbackCheck

为了帮助开发者排查回调连接失败的问题，提供这个网络检测的API。它可以对开发者URL做域名解析，然后对所有IP进行一次ping操作，得到丢包率和耗时。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/callback/check?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 | 枚举 |
| --- | --- | --- | --- | --- | --- |
| action | string | 是 | all | 检测动作：dns(域名解析)/ping(ping检测)/all(全部) | - |
| check_operator | string | 是 | DEFAULT | 检测运营商：CHINANET(电信)/UNICOM(联通)/CAP(腾讯)/DEFAULT(自动) | CHINANET UNICOM CAP DEFAULT |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| dns | objarray | DNS解析结果列表 |
| ping | objarray | PING检测结果列表 |

##### Res.dns(Array) Object Payload

DNS解析结果列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| ip | string | 解析出来的ip |
| real_operator | string | ip对应的运营商 |

##### Res.ping(Array) Object Payload

PING检测结果列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| ip | string | ping的ip，执行命令为ping ip –c 1-w 1 -q |
| from_operator | string | ping的源头的运营商，由请求中的check_operator控制 |
| package_loss | string | ping的丢包率，0%表示无丢包，100%表示全部丢包。因为目前仅发送一个ping包，因此取值仅有0%或者100%两种可能。 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "action": "all",
  "check_operator": "DEFAULT"
}
```

返回示例

```json
{
  "dns": [
    {
      "ip": "111.161.64.40",
      "real_operator": "UNICOM"
    },
    {
      "ip": "111.161.64.48",
      "real_operator": "UNICOM"
    }
  ],
  "ping": [
    {
      "ip": "111.161.64.40",
      "from_operator": "UNICOM",
      "package_loss": "0%",
      "time": "23.079ms"
    },
    {
      "ip": "111.161.64.48",
      "from_operator": "UNICOM",
      "package_loss": "0%",
      "time": "21.434ms"
    }
  ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40201 | invalid url | 未设置回调URL |
| 40202 | invalid action | 不正确的action参数 |
| 40203 | invalid check_operator | 不正确的运营商参数 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

### 获取微信API服务器IP

- 页面标题: 获取微信API服务器IP
- 接口英文名: getApiDomainIp
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/get_api_domain_ip?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/base/api_getapidomainip.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getApiDomainIp

该接口用于获取微信 api 服务器 ip 地址（开发者服务器主动访问 api.weixin.qq.com 的远端地址）

如果开发者基于安全等考虑，需要获知微信服务器的IP地址列表，以便进行相关限制，可以通过该接口获得微信服务器IP地址列表或者IP网段信息。

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/get_api_domain_ip?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| ip_list | array | 微信服务器IP地址列表 |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

- 由于出口 IP 及入口 IP 可能存在变动，建议用户每天请求接口1次，以便于及时更新IP列表。为了避免造成单点故障，强烈建议用户不要长期使用旧的 IP 列表作为 api.weixin.qq.com 的访问入口。
- 使用固定IP访问 api.weixin.qq.com 时，请开发者注意运营商适配，跨运营商访问可能会存在高峰期丢包问题。
- 由于出口 IP 及入口 IP 可能存在变动，建议用户每天请求接口 1 次，以便于及时更新 IP 列表。为了避免造成单点故障，强烈建议用户不要长期使用旧的IP列表作为 api.weixin.qq.com 的访问入口。

#### 5. 代码示例

##### 5.1 成功响应

请求示例

```json
{}
```

返回示例

```json
{
  "ip_list": [
    "101.89.47.18",
    "101.91.34.103"
  ]
}
```

##### 5.2 错误响应

请求示例

```json
{}
```

返回示例

```json
{
  "errcode": 40013,
  "errmsg": "invalid appid"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40013 | invalid appid | 不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

### 获取微信推送服务器IP

- 页面标题: 获取微信推送服务器IP
- 接口英文名: getCallbackIp
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/base/api_getcallbackip.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getCallbackIp

该接口用于获取微信推送服务器 ip 地址（向开发者服务器推送信息的微信服务器来源地址）

如果开发者基于安全等考虑，需要获知微信服务器的IP地址列表，以便进行相关限制，可以通过该接口获得微信服务器IP地址列表或者IP网段信息。

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| ip_list | string | 微信服务器IP地址列表 |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

- 由于出口 IP 及入口 IP 可能存在变动，建议用户每天请求接口1次，以便于及时更新IP列表。为了避免造成单点故障，强烈建议用户不要长期使用旧的 IP 列表作为 api.weixin.qq.com 的访问入口。
- 使用固定IP访问 api.weixin.qq.com 时，请开发者注意运营商适配，跨运营商访问可能会存在高峰期丢包问题。
- 由于出口 IP 及入口 IP 可能存在变动，建议用户每天请求接口 1 次，以便于及时更新 IP 列表。为了避免造成单点故障，强烈建议用户不要长期使用旧的IP列表作为 api.weixin.qq.com 的访问入口。

#### 5. 代码示例

##### 5.1 成功响应

请求示例

```json
{}
```

返回示例

```json
{
  "ip_list": [
    "106.55.206.146",
    "106.55.206.211"
  ]
}
```

##### 5.2 错误响应

请求示例

```json
{}
```

返回示例

```json
{
  "errcode": 40013,
  "errmsg": "invalid appid"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40013 | invalid appid | 无效的AppID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

## openApi管理

服务端 API 调用额度、配额与诊断相关接口。

### 重置API调用次数

- 页面标题: 重置API调用次数
- 接口英文名: clearQuota
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/clear_quota?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/apimanage/api_clearquota.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：clearQuota

本接口是通过access_token清空服务端接口的每日调用接口次数。

适用的账号类型为：公众号/服务号/小程序/小游戏/微信小店/带货助手/视频号助手/联盟带货机构/移动应用/网站应用/多端应用/第三方平台

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/clear_quota?access_token=ACCESS_TOKEN
```

支持加密请求： 本接口支持服务通信二次加密和签名，可有效防止数据篡改与泄露。 查看详情

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| appid | string | 是 | 要被清空的账号的appid |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

1、如果要清空公众号的接口的quota，则需要用公众号的access_token；如果要清空小程序的接口的quota，则需要用 小程序的access_token；如果要清空第三方平台的接口的quota，则需要用 第三方平台的component_access_token。如此类推。

2、如果是第三方服务商代公众号/服务号/小程序/微信小店/带货助手/视频号助手清除quota，则需要用 authorizer_access_token

3、每个账号每月共10次清零操作机会，清零生效一次即用掉一次机会；第三方帮公众号/服务号/小程序/微信小店/带货助手/视频号助手代调用时，实际上是在消耗公众号/服务号/小程序/微信小店/带货助手/视频号助手自身的quota

4、由于指标计算方法或统计时间差异，实时调用量数据可能会出现误差，一般在1%以内

#### 5. 代码示例

请求示例

```json
{
  "appid": "wx448f04719cd48f69"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | ok |
| 40013 | invalid appid | 不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写 |
| 48006 | forbid to clear quota because of reaching the limit | api 禁止清零调用次数，因为清零次数达到上限 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

### 查询API调用额度

- 页面标题: 查询API调用额度
- 接口英文名: getApiQuota
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/openapi/quota/get?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/apimanage/api_getapiquota.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getApiQuota

本接口用于查询服务端接口的的每日调用接口的额度，调用次数，频率限制。

适用账号类型：公众号/服务号/小程序/小游戏/微信小店/带货助手/视频号助手/联盟带货机构/移动应用/网站应用/多端应用/第三方平台等接口

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/openapi/quota/get?access_token=ACCESS_TOKEN
```

支持加密请求： 本接口支持服务通信二次加密和签名，可有效防止数据篡改与泄露。 查看详情

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| cgi_path | string | 是 | api的请求地址，例如"/cgi-bin/message/custom/send";不要前缀“https://api.weixin.qq.com”，也不要漏了"/",否则都会76003的报错 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 返回码 |
| errmsg | string | 错误信息 |
| quota | object | quota详情 |
| rate_limit | object | 普通调用频率限制 |
| component_rate_limit | object | 代调用频率限制 |

##### Res.quota Object Payload

quota详情

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| daily_limit | number | 当天该账号可调用该接口的次数 |
| used | number | 当天已经调用的次数 |
| remain | number | 当天剩余调用次数 |

##### Res.rate_limit Object Payload

普通调用频率限制

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| call_count | number | 周期内可调用数量，单位 次 |
| refresh_second | number | 更新周期，单位 秒 |

##### Res.component_rate_limit Object Payload

代调用频率限制

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| call_count | number | 周期内可调用数量，单位 次 |
| refresh_second | number | 更新周期，单位 秒 |

#### 4. 注意事项

1、如果查询的api属于公众号的接口，则需要用公众号的 access_token；如果查询的api属于小程序的接口，则需要用 小程序的access_token；如果查询的接口属于第三方平台的接口，则需要用 第三方平台的component_access_token；如此类推。

2、如果查询的接口属于第三方平台接口但用于公众号/小程序，则需要用第三方平台的 authorizer_access_token

2、如果是第三方服务商代公众号/服务号/小程序/微信小店/带货助手/视频号助手查询的接口，则需要用 authorizer_access_token

3、每个接口都有调用次数限制，请开发者合理调用接口。

4、”/xxx/sns/xxx“这类接口不支持使用该接口，会出现76022报错。

5、如果接口文档中有单独的说明接口的特殊的 quota 数量以及逻辑，则以每个接口的接口文档的描述为准。

#### 5. 代码示例

请求示例

```json
{
  "cgi_path": "/wxa/gettemplatedraftlist"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "quota": {
    "daily_limit": 0,
    "used": 0,
    "remain": 0
  }
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | ok |
| 76021 | cgi_path not found, please check | cgi_path填错了 |
| 76022 | could not use this cgi_path，no permission | 当前调用接口使用的token与api所属账号不符，详情可看注意事项的说明 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

### 查询rid信息

- 页面标题: 查询rid信息
- 接口英文名: getRidInfo
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/openapi/rid/get?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/apimanage/api_getridinfo.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getRidInfo

本接口用于查询调用服务端接口报错返回的rid详情信息，辅助开发者高效定位问题。

适用的账号类型如下：公众号/服务号/小程序/小游戏/微信小店/带货助手/视频号助手/联盟带货机构/移动应用/网站应用/多端应用/第三方平台。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/openapi/rid/get?access_token=ACCESS_TOKEN
```

支持加密请求： 本接口支持服务通信二次加密和签名，可有效防止数据篡改与泄露。 查看详情

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| rid | string | 是 | 调用接口报错返回的rid |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 返回码 |
| errmsg | string | 错误信息 |
| request | object | 该rid对应的请求详情 |

##### Res.request Object Payload

该rid对应的请求详情

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| invoke_time | number | 发起请求的时间戳 |
| cost_in_ms | number | 请求毫秒级耗时 |
| request_url | string | 请求的URL参数 |
| request_body | string | post请求的请求参数 |
| response_body | string | 接口请求返回参数 |
| client_ip | string | 接口请求的客户端ip |

#### 4. 注意事项

1、由于查询rid信息属于开发者私密行为，因此仅支持同账号的查询。举个例子，rid=1111，是小程序账号A调用某接口出现的报错，那么则需要使用小程序账号A的access_token调用当前接口查询rid=1111的详情信息，如果使用小程序账号B的身份查询，则出现报错，错误码为xxx。公众号、第三方平台账号等账号的接口同理。

2、如果是第三方服务商代公众号/服务号/小程序/小游戏/微信小店/带货助手/视频号助手查询调用 api返回的rid，则使用同一账号的 authorizer_access_token 调用即可。

3、rid的有效期只有7天，即只可查询最近7天的rid，查询超过7天的rid会出现报错，错误码为76001

4、”/xxx/sns/xxx“这类接口不支持使用该接口，会出现76022报错。

#### 5. 代码示例

请求示例

```json
{
  "rid": "61725984-6126f6f9-040f19c4"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "request": {
    "invoke_time": 1635156704,
    "cost_in_ms": 30,
    "request_url": "access_token=50_Im7xxxx",
    "request_body": "",
    "response_body": "{\"errcode\":45009,\"errmsg\":\"reach max api daily quota limit rid: 617682e0-09059ac5-34a8e2ea\"}",
    "client_ip": "113.xx.70.51"
  }
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | ok |
| 76001 | rid not found | rid不存在 |
| 76002 | rid is error | rid为空或者格式错误 |
| 76003 | could not query this rid,no permission | 当前账号无权查询该rid，该rid属于其他账号调用所产生 |
| 76004 | rid time is error | rid过期，仅支持持续7天内的rid |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

### 使用AppSecret重置API调用次数

- 页面标题: 使用AppSecret重置API调用次数
- 接口英文名: clearQuotaByAppSecret
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/clear_quota/v2
- 来源: https://developers.weixin.qq.com/doc/subscription/api/apimanage/api_clearquotabyappsecret.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：clearQuotaByAppSecret

本接口是通过AppSecret清空服务端接口的每日调用接口次数。

适用的账号类型为：公众号/服务号/小程序/小游戏/微信小店/带货助手/视频号助手/联盟带货机构/移动应用/网站应用/多端应用/第三方平台

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/clear_quota/v2
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口不支持第三方平台调用。

#### 2. 请求参数

##### 查询参数 Query String Parameters

无

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| appid | string | 是 | 要被清空的账号的appid |
| appsecret | string | 是 | 唯一凭证密钥，即 AppSecret |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

1、该接口通过 appsecret 调用，解决了 accesss_token 耗尽无法调用「重置 API 调用次数」的问题。

2、每个账号每月使用「重置 API 调用次数」与本接口共10次清零操作机会，清零生效一次即用掉一次机会；

3、由于指标计算方法或统计时间差异，实时调用量数据可能会出现误差，一般在1%以内

4、该接口仅支持POST调用

5、如果要清除 获取令牌接口 调用次数或者以服务商身份代商家清除公众号或者小程序调用次数，则需要使用 使用AppSecret重置第三方平台API调用次数接口。

#### 5. 代码示例

请求示例

```bash
POST  https://api.weixin.qq.com/cgi-bin/clear_quota/v2?appid=wx888888888888&appsecret=xxxxxxxxxxxxxxxxxxxxxxxx
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40013 | invalid appid | 不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写 |
| 41002 | appid missing | 缺少 appid 参数 |
| 41004 | appsecret missing | 缺少 secret 参数 |
| 48006 | forbid to clear quota because of reaching the limit | api 禁止清零调用次数，因为清零次数达到上限 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 重置指定API调用次数

- 页面标题: 重置指定API调用次数
- 接口英文名: clearApiQuota
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/openapi/quota/clear?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/apimanage/api_clearapiquota.html

#### 概要

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：clearApiQuota

本接口使用 access_token 来重置指定接口的每日调用次数

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/openapi/quota/clear?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台使用 component_access_token 自己调用，同时还支持代商家调用。
- 服务商获得任意权限集授权后，即可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 component_access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| cgi_path | string | 是 | /channels/ec/basics/info/get | api的请求地址，cgi_path 必须以"/channels/ec/"开头，不要前缀"https://api.weixin.qq.com"，也不要漏了"/" |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 示例 | 说明 |
| --- | --- | --- | --- |
| errcode | number | 0 | 错误码 |
| errmsg | string | ok | 错误信息 |

#### 4. 注意事项

- 可用于重置小程序、公众号、微信小店等微信开发生态业务接口，cgi_path 必须以"/"开头，例如"/channels/ec/"
- 如果是第三方服务商代清除quota，则需要用 authorizer_access_token；
- 每个账号每月共50次清零操作机会，清零生效一次即用掉一次机会；
- 由于指标计算方法或统计时间差异，实时调用量数据可能会出现误差，一般在1%以内。

#### 5. 代码示例

请求示例

```json
{
  "cgi_path":"/channels/ec/basics/info/get"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40001 | invalid credential access_token isinvalid or not latest | access_token 无效或不为最新获取的 access_token，请开发者确认access_token的有效性 |
| 41001 | access_token missing | 缺少 access_token 参数 |
| 42001 | access_token expired | access_token 超时，请检查 access_token 的有效期，请参考基础支持 - 获取 access_token 中，对 access_token 的详细机制说明 |
| 44002 | empty post data | POST 的数据包为空。post请求body参数不能为空。 |
| 45009 | reach max api daily quota limit | 超出接口每日调用限制 |
| 50002 | user limited | 用户受限，可能是用户帐号被冻结或注销 |
| 76021 | cgi_path not found, please check | cgi_path填错了 |
| 76022 | could not use this cgi_path，no permission | 当前调用接口使用的token与api所属账号不符，详情可看注意事项的说明 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 微信小店 联盟带货机构 带货助手 小店供货商 第三方平台 移动应用 网站应用 视频号助手 多端应用 ✔ ✔ ✔ ✔ ✔ ✔ ✔ ✔ 〇 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 〇：第三方平台可使用 component_access_token 调用，是否支持代商家调用需看本文档 调用方式 部分。

## 素材管理/永久素材

对应用户清单中的“素材管理 / 永久素材”分组；“上传图文消息图片”使用素材管理分支下的页面。

### 获取永久素材

- 页面标题: 获取永久素材
- 接口英文名: getMaterial
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_getmaterial.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getMaterial

本接口用于根据media_id获取永久素材的详细信息

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=ACCESS_TOKEN
```

##### 云调用

- 调用方法：officialAccount.material.get
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：3、11、18、30-31、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要获取的素材的media_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文素材，内容 |
| title | string | 视频素材，标题 |
| description | string | 视频素材，描述 |
| down_url | string | 视频下载，地址 |

##### Res.news_item(Array) Object Payload

图文素材，内容

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| title | string | 图文消息的标题 |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久mediaID） |
| show_cover_pic | number | 是否显示封面，0为false，即不显示，1为true，即显示 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS |
| url | string | 图文页的URL |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |

#### 4. 注意事项

除图文、视频之外，其他类型的素材消息，则响应的直接为素材的内容，开发者可以自行保存为文件。

#### 5. 代码示例

##### 5.1 图文素材请求示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
  "news_item": [
    {
      "title": "TITLE",
      "thumb_media_id": "THUMB_MEDIA_ID",
      "show_cover_pic": 1,
      "author": "AUTHOR",
      "digest": "DIGEST",
      "content": "CONTENT",
      "url": "URL",
      "content_source_url": "CONTENT_SOURCE_URL"
    }
  ]
}
```

##### 5.2 视频素材返回示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
  "title":TITLE,
  "description":DESCRIPTION,
  "down_url":DOWN_URL,
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40007 | invalid media_id | 无效的媒体ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取永久素材总数

- 页面标题: 获取永久素材总数
- 接口英文名: getMaterialCount
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_getmaterialcount.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getMaterialCount

本接口用于获取公众号永久素材的总数信息

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=ACCESS_TOKEN
```

##### 云调用

- 调用方法：officialAccount.material.getMaterialCount
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| voice_count | number | 语音总数量 |
| video_count | number | 视频总数量 |
| image_count | number | 图片总数量 |
| news_count | number | 图文总数量 |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

1.永久素材的总数包含公众平台官网素材管理中的素材 2.图片和图文消息素材(包括单图文和多图文)的总数上限为100000，其他素材的总数上限为1000 3.调用该接口需https协议

#### 5. 代码示例

##### 5.1 成功示例

请求示例

```json
{}
```

返回示例

```json
{
  "voice_count": 5,
  "video_count": 3,
  "image_count": 10,
  "news_count": 7
}
```

##### 5.2 错误示例

请求示例

```json
{}
```

返回示例

```json
{
  "errcode": -1,
  "errmsg": "system error"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统错误 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取永久素材列表

- 页面标题: 获取永久素材列表
- 接口英文名: batchGetMaterial
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_batchgetmaterial.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：batchGetMaterial

分类型获取永久素材列表，包含公众号在官网素材管理模块新建的素材

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=ACCESS_TOKEN
```

##### 云调用

- 调用方法：officialAccount.material.batchGetMaterial
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 | 枚举 |
| --- | --- | --- | --- | --- | --- |
| type | string | 是 | image | 素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news） | image video voice news |
| offset | number | 是 | 0 | 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回 | - |
| count | number | 是 | 20 | 返回素材的数量，取值在1到20之间 | - |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| item | objarray | 多个图文消息 |
| total_count | number | 该类型的素材的总数 |
| item_count | number | 本次调用获取的素材的数量 |

##### Res.item(Array) Object Payload

多个图文消息

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| media_id | string | 消息ID |
| content | object | 图文消息，内容 |
| update_time | number | 更新日期 |
| name | string | 图片、语音、视频素材的名字 |
| url | string | 图片、语音、视频素材URL |

##### Res.item(Array).content Object Payload

图文消息，内容

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文消息内的1篇或多篇文章 |

##### Res.item(Array).content.news_item Object Payload

图文消息内的1篇或多篇文章

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| title | string | 图文消息的标题 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久mediaID） |
| show_cover_pic | number | 是否显示封面，0为false，即不显示，1为true，即显示 |
| url | string | 图文页的URL，或者，当获取的列表是图片素材列表时，该字段是图片的URL |
| thumb_url | string | 图文消息的封面图片素材id（必须是永久mediaID） |

#### 4. 注意事项

1、包含公众平台官网新建的图文消息、语音、视频等素材 2、临时素材无法通过本接口获取 3、需https协议调用

#### 5. 代码示例

##### 5.1 获取图文素材

请求示例

```json
{
  "type": "news",
  "offset": 0,
  "count": 20
}
```

返回示例

```json
{
  "total_count": 100,
  "item_count": 20,
  "item": [
    {
      "media_id": "MEDIA_ID",
      "content": {
        "news_item": [
          {
            "title": "TITLE",
            "thumb_media_id": "THUMB_MEDIA_ID",
            "show_cover_pic": 1,
            "author": "AUTHOR",
            "digest": "DIGEST",
            "content": "CONTENT",
            "url": "URL",
            "content_source_url": "CONTENT_SOURCE_URL"
          }
        ]
      },
      "update_time": 1620000000
    }
  ]
}
```

##### 5.2 获取图片素材

请求示例

```json
{
  "type": "image",
  "offset": 0,
  "count": 10
}
```

返回示例

```json
{
  "total_count": 50,
  "item_count": 10,
  "item": [
    {
      "media_id": "MEDIA_ID",
      "name": "IMAGE.jpg",
      "update_time": 1620000000,
      "url": "http://mmbiz.qpic.cn/xxx"
    }
  ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40004 | invalid media type | 不合法的媒体文件类型 |
| 40007 | invalid media_id | 无效媒体ID错误 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 上传图文消息图片

- 页面标题: 上传图文消息图片
- 接口英文名: uploadImage
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_uploadimage.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：uploadImage

本接口用于上传图文消息内所需的图片

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
```

##### 云调用

- 调用方法：officialAccount.media.uploadImg
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：1、8-9、11、18、37、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| media | formdata | 是 | 图片文件 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| url | string | 图片URL |
| errcode | number | 错误码 |
| errmsg | string | 错误描述 |

#### 4. 注意事项

- 该接口所上传的图片，不占用公众号的素材库中图片数量的100000个的限制，图片仅支持jpg/png格式，大小必须在1MB以下。
- 图文消息支持正文中插入自己账号和其他公众号已群发文章链接的能力。

#### 5. 代码示例

请求示例

```bash
curl -F media=@test.jpg "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN"
```

返回示例

```json
{
  "url": "http://mmbiz.qpic.cn/XXXXX",
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40005 | invalid file type | 上传素材文件格式不对 |
| 40009 | invalid image size | 图片尺寸太大 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 上传永久素材

- 页面标题: 上传永久素材
- 接口英文名: addMaterial
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=video
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_addmaterial.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：addMaterial

本接口用于新增图片/语音/视频等类型的永久素材。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=video
```

##### 云调用

- 调用方法：officialAccount.material.addMaterial
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |
| type | string | 是 | video | 媒体类型，图片（image）、语音（voice）、视频（video）和缩略图（thumb） |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| media | formdata | 是 | 媒体文件标识 |
| description | object | 否 | 素材描述信息，上传视频素材时需要 |

##### Body.description Object Payload

素材描述信息，上传视频素材时需要

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| title | string | 否 | 视频标题 | 视频素材描述标题 |
| introduction | string | 否 | 视频简介 | 视频素材描述简介 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| media_id | string | 新增的永久素材media_id |
| url | string | 图片素材URL(仅图片返回) |

#### 4. 注意事项

- 永久图片素材新增后，将带有URL返回给开发者，开发者可以在腾讯系域名内使用（腾讯系域名外使用，图片将被屏蔽）。
- 公众号的素材库保存总数量有上限：图文消息素材、图片素材上限为100000，其他类型为1000。
- 素材的格式大小等要求与公众平台官网一致：

- 图片（image）: 10M，支持bmp/png/jpeg/jpg/gif格式
- 语音（voice）：2M，播放长度不超过60s，mp3/wma/wav/amr格式
- 视频（video）：10MB，支持MP4格式
- 缩略图（thumb）：64KB，支持JPG格式

- 图文消息的具体内容中，微信后台将过滤外部的图片链接，图片url需通过 上传图文消息图片 接口上传图片获取。
- 上传图文消息图片 接口所上传的图片，不占用公众号的素材库中图片数量的100000个的限制，图片仅支持jpg/png格式，大小必须在1MB以下。
- 图文消息支持正文中插入自己账号和其他公众号/服务号已群发文章链接的能力。

#### 5. 代码示例

##### 5.1 新增视频示例

请求示例

```bash
curl "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=TYPE" -F media=@media.file -F description='{"title":VIDEO_TITLE, "introduction":INTRODUCTION}'
```

返回示例

```json
{
  "media_id": "MEDIA_ID_123456",
  "url": ""
}
```

##### 5.2 新增图片示例

请求示例

```json
curl "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=TYPE" -F media=@media.file
```

返回示例

```json
{
  "media_id": "MEDIA_ID_654321",
  "url": "https://example.com/image.jpg"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40007 | invalid media_id | 无效媒体ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 删除永久素材

- 页面标题: 删除永久素材
- 接口英文名: delMaterial
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_delmaterial.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：delMaterial

本接口用于删除不再需要的永久素材，节省存储空间

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=ACCESS_TOKEN
```

##### 云调用

- 调用方法：officialAccount.material.delelete
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要删除的素材media_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

- 请谨慎操作本接口，可以删除官网素材管理模块中的图文/语音/视频等素材（需先通过获取素材列表获取media_id）
- 临时素材无法通过本接口删除",
- 调用该接口需https协议

#### 5. 代码示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 0 | ok | 成功 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40007 | invalid media_id | 不合法的媒体文件 id |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

## 素材管理/临时素材

对应用户清单中的“素材管理 / 临时素材”分组。

### 获取临时素材

- 页面标题: 获取临时素材
- 接口英文名: getMedia
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/temporary/api_getmedia.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getMedia

本接口用于获取临时素材（即下载临时的多媒体文件）。

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
```

##### 云调用

- 调用方法：officialAccount.media.get
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：1、3、8-9、11、19、30-31、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |
| media_id | string | 是 | MEDIA_ID | 媒体文件ID |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |
| video_url | string | 视频消息素材下载地址 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

##### 5.1 视频素材返回示例

请求示例

```json
curl -I -G "https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID"
```

返回示例

```json
{
  "video_url": "DOWN_URL"
}
```

##### 5.2 错误示例

请求示例

```json
curl -I -G "https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID"
```

返回示例

```json
{
  "errcode": 40007,
  "errmsg": "invalid media_id"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40007 | invalid media_id | 无效的媒体ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 新增临时素材

- 页面标题: 新增临时素材
- 接口英文名: uploadTempMedia
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/temporary/api_uploadtempmedia.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：uploadTempMedia

本接口用于上传临时多媒体文件

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE
```

##### 云调用

- 调用方法：officialAccount.media.upload
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：1、3、8-9、11、19、30-31、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |
| type | string | 是 | 媒体文件类型，分别有图片（image）、语音（voice）、视频（video）和缩略图（thumb） |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| media | formdata | 是 | form-data 中媒体文件标识，有filename、filelength、content-type等信息 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 媒体文件类型 |
| media_id | string | 媒体文件标识 |
| created_at | number | 上传时间戳 |

#### 4. 注意事项

- 文件大小限制：图片2MB/视频10MB
- 媒体文件保存3天

###### 其他补充

1、临时素材media_id是可复用的。

2、 媒体文件在微信后台保存时间为3天，即3天后media_id失效。

3、上传临时素材的格式、大小限制与公众平台官网一致。

4、图片（image）: 10M，支持PNG\JPEG\JPG\GIF格式

5、语音（voice）：2M，播放长度不超过60s，支持AMR\MP3格式

6、视频（video）：10MB，支持MP4格式

7、缩略图（thumb）：64KB，支持JPG格式

#### 5. 代码示例

请求示例

```bash
curl -F media=@test.jpg "https://api.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE"
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "type": "image",
  "media_id": "MEDIA_ID",
  "created_at": 1672500000
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | system error | 系统繁忙，此时请开发者稍候再试 |
| 40001 | invalid credential access_token isinvalid or not latest | 获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口 |
| 40004 | invalid media type | 不合法的媒体文件类型 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

小程序 公众号 服务号 小游戏 ✔ ✔ ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取高清语音素材

- 页面标题: 获取高清语音素材
- 接口英文名: getHDVoice
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
- 来源: https://developers.weixin.qq.com/doc/subscription/api/material/temporary/api_gethdvoice.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getHDVoice

本接口用于获取从 JSSDK 的 uploadVoice 接口上传的临时语音素材，格式为speex，16K采样率。该音频比临时素材获取接口（格式为amr，8K采样率）更加清晰，适合用作语音识别等对音质要求较高的业务。

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
```

##### 云调用

- 调用方法：officialAccount.media.getFromJSSDK
- 出入参和 HTTPS 调用相同，调用方式可查看 云调用 说明文档。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：1、8-9、11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |
| media_id | string | 是 | MEDIA_ID | uploadVoice接口返回的serverID |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

需使用speex解码库进行转码处理，解码库详见文档链接

#### 5. 代码示例

##### 5.1 错误请求

请求示例

```json
curl -I -G "https://api.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=ACCESS_TOKEN&media_id=MEDIA_ID"
```

返回示例

```json
{
  "errcode": 40007,
  "errmsg": "invalid media_id"
}
```

##### 5.2 正常请求

请求示例

```json
curl -I -G "https://api.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=ACCESS_TOKEN&media_id=MEDIA_ID"
```

返回示例

```bash
file buffer
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40007 | invalid media_id | 无效的媒体ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 仅认证

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

## 草稿管理与商品卡片/草稿管理

对应用户清单中的“草稿管理与商品卡片 / 草稿管理”分组。

### 草稿箱开关设置

- 页面标题: 草稿箱开关设置
- 接口英文名: draft_switch
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/switch?access_token=ACCESS_TOKEN&checkonly=1
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_switch.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_switch

本接口用于设置或查询草稿箱和发布功能的开关状态。

- 内测期间会逐步放量，任何用户都可能会自动打开；
- 此开关开启后不可逆，换言之，无法从开启的状态回到关闭；
- 内测期间，无论开关开启与否，旧版的图文素材API，以及新版的草稿箱、发布等API均可以正常使用；
- 在内测结束之后，所有用户都将自动开启，即草稿箱、发布等功能将对所有用户开放，本开关连同之前的图文素材API也将随后下线。

###### 其他说明

由于草稿箱和发布功能仍处于内测阶段，若公众号没有被灰度覆盖，可能无法体验草稿箱和发布功能。为了解决这个问题，我们在上述API接口的基础上，设了这样一个开关：当一个公众号选择开启后，该账号在微信公众平台后台（mp.weixin.qq.com)上的图文素材库将升级为草稿箱，并可以在微信公众平台后台使用发布功能。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/switch?access_token=ACCESS_TOKEN&checkonly=1
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |
| checkonly | number | 否 | 1 | 仅检查状态时传1 |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |
| is_open | number | 仅 errcode==0 (即调用成功) 时返回，0 表示开关处于关闭，1 表示开启成功（或开关已开启） |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

##### 5.1 设置开关状态

请求示例

```bash
https://api.weixin.qq.com/cgi-bin/draft/switch?access_token=ACCESS_TOKEN
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

##### 5.2 查询开关状态

请求示例

```bash
https://api.weixin.qq.com/cgi-bin/draft/switch?access_token=ACCESS_TOKEN&checkonly=1
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "is_open": 0
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 更新草稿

- 页面标题: 更新草稿
- 接口英文名: draft_update
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/update?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_update.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_update

本接口用于修改图文或图片消息草稿。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/update?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要修改的图文消息的id |
| index | number | 是 | 0 | 要更新的文章在图文消息中的位置（多图文消息时，此字段才有意义），第一篇为0 |
| articles | object | 是 | - | 图文信息 |

##### Body.articles Object Payload

图文信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| article_type | string | 否 | 文章类型，分别有图文消息（news）、图片消息（newspic），不填默认为图文消息（news） |
| title | string | 是 | 标题 |
| author | string | 否 | 作者 |
| digest | string | 否 | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 是 | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 否 | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 否 | 图文消息的封面图片素材id（必须是永久MediaID） |
| need_open_comment | number | 否 | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 否 | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| pic_crop_235_1 | string | 否 | 图文消息封面裁剪为2.35:1规格的坐标字段。以原始图片（thumb_media_id）左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标即为（X1,Y1）,右下角所在的坐标则为（X2,Y2），用分隔符_拼接为X1_Y1_X2_Y2，每个坐标值的精度为不超过小数点后6位数字。示例见下图，图中(X1,Y1) 等于（0.1945,0）,(X2,Y2)等于（1,0.5236），所以请求参数值为0.1945_0_1_0.5236。 |
| pic_crop_1_1 | string | 否 | 图文消息封面裁剪为1:1规格的坐标字段，裁剪原理同pic_crop_235_1，裁剪后的图片必须符合规格要求。 |
| image_info | object | 是 | 图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图 |
| cover_info | object | 否 | 图片消息的封面信息 |
| product_info | object | 否 | 商品信息 |

##### Body.articles.image_info Object Payload

图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image_list | objarray | 是 | 图片列表 |

##### Body.articles.image_info.image_list(Array) Object Payload

图片列表

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image_media_id | string | 是 | 图片消息里的图片素材id（必须是永久MediaID） |

##### Body.articles.cover_info Object Payload

图片消息的封面信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| crop_percent_list | objarray | 否 | 封面裁剪信息，。以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数，右下角所在的坐标填入x2，y2参数 |

##### Body.articles.cover_info.crop_percent_list(Array) Object Payload

封面裁剪信息，。以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数，右下角所在的坐标填入x2，y2参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ratio | string | 否 | 裁剪比例，支持：“1_1”，“16_9”,“2.35_1” |
| x1 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数 |
| y1 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数 |
| x2 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其右下角所在的坐标填入x2，y2参数 |
| y2 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其右下角所在的坐标填入x2，y2参数 |

##### Body.articles.product_info Object Payload

商品信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| footer_product_info | object | 否 | 文末插入商品相关信息 |

##### Body.articles.product_info.footer_product_info Object Payload

文末插入商品相关信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| product_key | string | 否 | 商品key |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

##### 5.1 更新图文消息草稿

请求示例

```json
{
    "media_id":MEDIA_ID,
    "index":INDEX,
    "articles":{
        "article_type":"news",
        "title":TITLE,
        "author":AUTHOR,
        "digest":DIGEST,
        "content":CONTENT,
        "content_source_url":CONTENT_SOURCE_URL,
        "thumb_media_id":THUMB_MEDIA_ID,
        "need_open_comment":0,
        "only_fans_can_comment":0,
        "pic_crop_235_1":X1_Y1_X2_Y2,
        "pic_crop_1_1":X1_Y1_X2_Y2
    }
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

##### 5.2 更新图片消息草稿

请求示例

```json
{
    "media_id":MEDIA_ID,
    "index":INDEX,
    "articles":{
        "article_type":"newspic",
        "title":TITLE,
        "content":CONTENT,
        "need_open_comment":0,
        "only_fans_can_comment":0,
        "image_info":{
            "image_list":[
                {
                    "image_media_id":IMAGE_MEDIA_ID
                }
            ]
        },
        "cover_info":{
            "crop_percent_list":[
                {
                    "ratio": "1_1",
                    "x1":"0.166454",
                    "y1":"0",
                    "x2":"0.833545",
                    "y2":"1"
                }
                // 如有其他比例的裁剪需求，可继续在此处填写
            ]
        },
        "product_info": {
            "footer_product_info": {
                "product_key":PRODUCT_KEY
            }
        }
    }
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |
| 40114 | invalid index value |  |
| 41039 | invalid content_source_url |  |
| 45166 | invalid content |  |
| 53404 | 账号已被限制带货能力 | 请删除商品后重试 |
| 53405 | 插入商品信息有误 | 请检查参数及商品状态 |
| 53406 | 请先开通带货能力 |  |
| 88000 | without comment privilege |  |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取草稿列表

- 页面标题: 获取草稿列表
- 接口英文名: draft_batchget
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_batchget.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_batchget

新增草稿之后，可用本接口获取草稿列表信息。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| offset | number | 是 | 0 | 从全部素材的该偏移位置开始返回，0表示从第一个素材返回 |
| count | number | 是 | 10 | 返回素材的数量，取值在1到20之间 |
| no_content | number | 否 | 1 | 1 表示不返回 content 字段，0 表示正常返回，默认为 0 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total_count | number | 草稿素材的总数 |
| item_count | number | 本次调用获取的素材的数量 |
| item | objarray | 素材列表 |

##### Res.item(Array) Object Payload

素材列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| media_id | string | 图文消息的id |
| content | object | 图文消息内容 |
| update_time | number | 图文消息更新时间 |

##### Res.item(Array).content Object Payload

图文消息内容

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文内容列表 |

##### Res.item(Array).content.news_item Object Payload

图文内容列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| article_type | string | 文章类型，分别有图文消息（news）、图片消息（newspic），不填默认为图文消息（news） |
| title | string | 标题 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久MediaID） |
| need_open_comment | number | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| image_info | object | 图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图 |
| product_info | object | 商品信息 |
| url | string | 草稿的临时链接 |

##### Res.item(Array).content.news_item.image_info Object Payload

图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| image_list | objarray | 图片列表 |

##### Res.item(Array).content.news_item.image_info.image_list Object Payload

图片列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| image_media_id | string | 图片消息里的图片素材id（必须是永久MediaID） |

##### Res.item(Array).content.news_item.product_info Object Payload

商品信息

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| footer_product_info | object | 文末插入商品相关信息 |

##### Res.item(Array).content.news_item.product_info.footer_product_info Object Payload

文末插入商品相关信息

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| product_key | string | 商品key |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "offset": 0,
  "count": 10,
  "no_content": 1
}
```

返回示例

```json
{
    "total_count":TOTAL_COUNT,
    "item_count":ITEM_COUNT,
    "item":[
        {
            "media_id":MEDIA_ID,
            "content": {
                "news_item" : [
                    {
                        "article_type":"news",
                        "title":TITLE,
                        "author":AUTHOR,
                        "digest":DIGEST,
                        "content":CONTENT,
                        "content_source_url":CONTENT_SOURCE_URL,
                        "thumb_media_id":THUMB_MEDIA_ID,
                        "need_open_comment":0,
                        "only_fans_can_comment":0,
                        "url":URL
                    },
                    {
                        "article_type":"newspic",
                        "title":TITLE,
                        "content":CONTENT,
                        "thumb_media_id":THUMB_MEDIA_ID,
                        "need_open_comment":0,
                        "only_fans_can_comment":0,
                        "image_info":{
                            "image_list":[
                                {
                                    "image_media_id":IMAGE_MEDIA_ID
                                }
                            ]
                        },
                        "product_info": {
                            "footer_product_info": {
                                "product_key":PRODUCT_KEY
                            }
                        },
                        "url":URL
                    }
                ]
            },
            "update_time": UPDATE_TIME
        }
    ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | 成功 | ok是指从不正常变成正常 in a normal state是指本来就正常 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 新增草稿

- 页面标题: 新增草稿
- 接口英文名: draft_add
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_add

本接口用于新增常用的素材到草稿箱。

1.上传到草稿箱中的素材被群发或发布后，该素材将从草稿箱中移除 2.新增草稿也可在公众平台官网-草稿箱中查看和管理

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| articles | objarray | 是 | 图文素材集合 |

##### Body.articles(Array) Object Payload

图文素材集合

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| article_type | string | 否 | 文章类型，分别有图文消息（news）、图片消息（newspic），不填默认为图文消息（news） |
| title | string | 是 | 标题，总长度不超过32个字。注意不要使用Unicode转义格式。系统会自动处理编码问题。即，不要输入"\u4f5c\u8005\u540d"这种表达，直接传字符串即可。 |
| author | string | 否 | 作者，总长度不超过16个字。注意不要使用Unicode转义格式。系统会自动处理编码问题。即，不要输入"\u4f5c\u8005\u540d"这种表达，直接传字符串即可。 |
| digest | string | 否 | 图文消息的摘要，总长度不超过128个字。仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 是 | 图文消息的具体内容，大小不可超过2kb，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 否 | 图文消息的原文地址，大小不可超过1 kb，即点击“阅读原文”后的URL |
| thumb_media_id | string | 否 | article_type为图文消息（news）时必填，图文消息的封面图片素材id（必须是永久MediaID） |
| need_open_comment | number | 否 | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 否 | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| pic_crop_235_1 | string | 否 | 图文消息封面裁剪为2.35:1规格的坐标字段。以原始图片（thumb_media_id）左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标即为（X1,Y1）,右下角所在的坐标则为（X2,Y2），用分隔符_拼接为X1_Y1_X2_Y2，每个坐标值的精度为不超过小数点后6位数字。示例见下图，图中(X1,Y1) 等于（0.1945,0）,(X2,Y2)等于（1,0.5236），所以请求参数值为0.1945_0_1_0.5236。 |
| pic_crop_1_1 | string | 否 | 图文消息封面裁剪为1:1规格的坐标字段，裁剪原理同pic_crop_235_1，裁剪后的图片必须符合规格要求。 |
| image_info | object | 是 | 图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图 |
| cover_info | object | 否 | 图片消息的封面信息 |
| product_info | object | 否 | 商品信息 |

##### Body.articles(Array).image_info Object Payload

图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image_list | objarray | 是 | 图片列表 |

##### Body.articles(Array).image_info.image_list Object Payload

图片列表

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image_media_id | string | 是 | 图片消息里的图片素材id（必须是永久MediaID） |

##### Body.articles(Array).cover_info Object Payload

图片消息的封面信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| crop_percent_list | objarray | 否 | 封面裁剪信息，。以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数，右下角所在的坐标填入x2，y2参数 |

##### Body.articles(Array).cover_info.crop_percent_list Object Payload

封面裁剪信息，。以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数，右下角所在的坐标填入x2，y2参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ratio | string | 否 | 裁剪比例，支持：“1_1”，“16_9”,“2.35_1” |
| x1 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数 |
| y1 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其左上角所在的坐标填入x1，y1参数 |
| x2 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其右下角所在的坐标填入x2，y2参数 |
| y2 | string | 否 | 以图片左上角（0,0），右下角（1,1）建立平面坐标系，经过裁剪后的图片，其右下角所在的坐标填入x2，y2参数 |

##### Body.articles(Array).product_info Object Payload

商品信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| footer_product_info | object | 否 | 文末插入商品相关信息 |

##### Body.articles(Array).product_info.footer_product_info Object Payload

文末插入商品相关信息

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| product_key | string | 否 | 商品key |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| media_id | string | 上传后的获取标志(不超过128字符) |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
    "articles": [
        // 图文消息结构
        {
            "article_type":"news",
            "title":TITLE,
            "author":"麦多多",// 请将 \uXXXX 格式的编码转换为实际字符后再输入。
            "digest":DIGEST,
            "content":CONTENT,
            "content_source_url":CONTENT_SOURCE_URL,
            "thumb_media_id":"R7Ifp6ogGOmtr3u-l6KIJfD6AX2foQ7Ktp4flZtYJbtO2H-Tmfg4xO0sl9mh9ByJ",
            "need_open_comment":0,
            "only_fans_can_comment":0,
            "pic_crop_235_1":X1_Y1_X2_Y2,
            "pic_crop_1_1":X1_Y1_X2_Y2
        },
        // 图片消息结构
        {
            "article_type":"newspic",
            "title":TITLE,
            "content":CONTENT,
            "need_open_comment":0,
            "only_fans_can_comment":0,
            "image_info":{
                "image_list":[
                    {
                        "image_media_id":IMAGE_MEDIA_ID
                    }
                ]
            },
            "cover_info":{
                "crop_percent_list":[
                    {
                        "ratio": "1_1",
                        "x1":"0.166454",
                        "y1":"0",
                        "x2":"0.833545",
                        "y2":"1"
                    }
                    // 如有其他比例的裁剪需求，可继续在此处填写
                ]
            },
            "product_info": {
                "footer_product_info": {
                    "product_key":PRODUCT_KEY
                }
            }
        }
    ]
}
```

返回示例

```json
{
  "media_id": "MEDIA_ID"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 53404 | 账号已被限制带货能力 | 请删除商品后重试 |
| 53405 | 插入商品信息有误 | 检查参数及商品状态 |
| 53406 | 请先开通带货能力 |  |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

接口变更日志（2条） 2025 年 12 月 19 日 更新 title 、 author 、 digest 、 content 、 content_source_url 字段描述 2025 年 11 月 26 日 更新 author 字段描述，文档描述优化

### 获取草稿的总数

- 页面标题: 获取草稿的总数
- 接口英文名: draft_count
- 调用方式: GET https://api.weixin.qq.com/cgi-bin/draft/count?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_count.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_count

获取草稿的总数，此接口只统计数量，不返回草稿的具体内容

#### 1. 调用方式

##### HTTPS 调用

```bash
GET https://api.weixin.qq.com/cgi-bin/draft/count?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

无

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total_count | number | 草稿的总数 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```bash
https://api.weixin.qq.com/cgi-bin/draft/count
```

返回示例

```json
{
  "total_count": 15
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok或者in a normal state | ok是指从不正常变成正常 in a normal state是指本来就正常 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 删除草稿

- 页面标题: 删除草稿
- 接口英文名: draft_delete
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_delete.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：draft_delete

删除指定草稿，节省空间。此操作不可撤销，请谨慎操作。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| access_token | string | 是 | ACCESS_TOKEN | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要删除的草稿的media_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

此操作无法撤销，请谨慎操作。

#### 5. 代码示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| -1 | 公共错误码 | 查看文档 |
| 0 | ok | 成功 |
| 40007 | invalid media_id | 不合法的媒体文件 id |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取草稿详情

- 页面标题: 获取草稿详情
- 接口英文名: getDraft
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/draft/get?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_getdraft.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：getDraft

新增草稿后，可通过该接口下载草稿

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/draft/get?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：11、100
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要获取的草稿的media_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文素材列表 |

##### Res.news_item(Array) Object Payload

图文素材列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| article_type | string | 文章类型，分别有图文消息（news）、图片消息（newspic），不填默认为图文消息（news） |
| title | string | 标题 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久MediaID） |
| need_open_comment | number | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| image_info | object | 图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图 |
| product_info | object | 商品信息 |
| url | string | 草稿的临时链接 |

##### Res.news_item(Array).image_info Object Payload

图片消息里的图片相关信息，图片数量最多为20张，首张图片即为封面图

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| image_list | objarray | 图片列表 |

##### Res.news_item(Array).image_info.image_list Object Payload

图片列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| image_media_id | string | 图片消息里的图片素材id（必须是永久MediaID） |

##### Res.news_item(Array).product_info Object Payload

商品信息

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| footer_product_info | object | 文末插入商品相关信息 |

##### Res.news_item(Array).product_info.footer_product_info Object Payload

文末插入商品相关信息

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| product_key | string | 商品key |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
    "news_item": [
        {
            "article_type":"news",
            "title":TITLE,
            "author":AUTHOR,
            "digest":DIGEST,
            "content":CONTENT,
            "content_source_url":CONTENT_SOURCE_URL,
            "thumb_media_id":THUMB_MEDIA_ID,
            "show_cover_pic":0,
            "need_open_comment":0,
            "only_fans_can_comment":0,
            "url":URL
        },
        {
            "article_type":"newspic",
            "title":TITLE,
            "content":CONTENT,
            "thumb_media_id":THUMB_MEDIA_ID,
            "need_open_comment":0,
            "only_fans_can_comment":0,
            "image_info":{
                "image_list":[
                    {
                        "image_media_id":IMAGE_MEDIA_ID
                    }
                ]
            },
            "product_info": {
                "footer_product_info": {
                    "product_key":PRODUCT_KEY
                }
            },
            "url":URL
        }
    ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40007 | invalid media_id | 无效的媒体ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

## 草稿管理与商品卡片/商品卡片

对应用户清单中的“草稿管理与商品卡片 / 商品卡片”分组。

### 获取商品卡片的DOM结构

- 页面标题: 获取商品卡片的DOM结构
- 接口英文名: ecsgetproductcardinfo
- 调用方式: POST https://api.weixin.qq.com/channels/ec/service/product/getcardinfo?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/draftbox/shop/api_ecsgetproductcardinfo.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：ecsgetproductcardinfo

本接口用于获取在文章中插入商品卡片所需的DOM结构

注：不同文章类型支持的卡片类型范围不同

- 图片消息：支持小卡、文字链接、条卡
- 图文消息：支持大卡、小卡、文字链接

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/channels/ec/service/product/getcardinfo?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口不支持第三方平台调用。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| product_id | string | 是 | 1000000000 | 商品id |
| article_type | string | 是 | newspic | 文章类型，当前支持：图片消息(newspic)、图文消息(news) |
| card_type | number | 是 | 2 | 卡片类型，当前支持：大卡(0)、小卡(1)、文字链接(2)、条卡(3) |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |
| product_key | string | 商品 key，部分文章类型插入商品卡片需要该 key |
| DOM | string | 商品卡DOM结构，多数文章类型插入商品卡片需要DOM结构 |

#### 4. 注意事项

正常情况下调用成功时，errcode将为0。错误时微信会返回错误码等信息，请根据错误码查询错误信息。

product_key 和 DOM 只会在需要该字段的文章类型及卡片类型的请求中返回。

#### 5. 代码示例

请求示例

```json
{
  "product_id": "1000000000",
  "article_type": "newspic",
  "card_type": 2
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "product_key": "PRODUCT_KEY",
  "DOM": "DOM"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |
| 10170001 | 不合法的商品ID |  |
| 10170002 | 不支持的文章类型 |  |
| 10170003 | 不支持的卡片类型 |  |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 ✔ ✔

✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

## 发布能力

图文草稿发布、查询与删除相关接口。

### 获取已发布的消息列表

- 页面标题: 获取已发布的消息列表
- 接口英文名: freepublish_batchget
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_batchget.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：freepublish_batchget

本接口用于获取已成功发布的消息列表

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：7
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| offset | number | 是 | 0 | 从全部素材的该偏移位置开始返回，0表示从第一个素材返回 |
| count | number | 是 | 10 | 返回素材的数量，取值在1到20之间 |
| no_content | number | 否 | 0 | 1 表示不返回content字段，0表示正常返回，默认为0 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total_count | number | 成功发布素材的总数 |
| item_count | number | 本次调用获取的素材的数量 |
| item | objarray | 图文消息条目列表 |

##### Res.item(Array) Object Payload

图文消息条目列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| article_id | string | 成功发布的图文消息id |
| content | object | 图文消息内容 |
| update_time | number | 图文消息更新时间 |

##### Res.item(Array).content Object Payload

图文消息内容

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文内容列表 |

##### Res.item(Array).content.news_item Object Payload

图文内容列表

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| title | string | 标题 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久MediaID） |
| thumb_url | string | 图文消息的封面图片URL |
| need_open_comment | number | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| url | string | 草稿的临时链接 |
| is_deleted | boolean | 该图文是否被删除 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "offset": 0,
  "count": 10,
  "no_content": 0
}
```

返回示例

```json
{
  "total_count": 100,
  "item_count": 10,
  "item": [
    {
      "article_id": "ARTICLE_ID_1",
      "content": {
        "news_item": [
          {
            "title": "示例标题",
            "author": "作者名",
            "digest": "摘要内容",
            "content": "HTML内容",
            "content_source_url": "https://example.com/source",
            "thumb_media_id": "MEDIA_ID_123",
            "show_cover_pic": 1,
            "need_open_comment": 0,
            "only_fans_can_comment": 0,
            "url": "https://example.com/article",
            "is_deleted": false
          }
        ]
      },
      "update_time": 1627891234
    }
  ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | ok是指从不正常变成正常 in a normal state是指本来就正常 |
| 48001 | api unauthorized | api 功能未授权，请确认公众号/服务号已获得该接口，可以在「公众平台官网 - 开发者中心页」中查看接口权限 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 ✔

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 ✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 删除发布文章

- 页面标题: 删除发布文章
- 接口英文名: freepublishDelete
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/freepublish/delete?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublishdelete.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：freepublishDelete

本接口用于删除已发布的文章，此操作不可逆，请谨慎操作

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/freepublish/delete?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：7
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| article_id | string | 是 | ARTICLE_ID | 成功发布时返回的 article_id |
| index | number | 否 | 1 | 要删除的文章在图文消息中的位置，第一篇编号为1，该字段不填或填0会删除全部文章 |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "article_id": "ARTICLE_ID",
  "index": 1
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |
| 48001 | api unauthorized | api 功能未授权，请确认公众号/服务号已获得该接口，可以在「公众平台官网 - 开发者中心页」中查看接口权限 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 ✔

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 ✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 发布状态查询

- 页面标题: 发布状态查询
- 接口英文名: freepublish_get
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_get.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：freepublish_get

本接口用于查询发布任务的状态和详情

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：7
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| publish_id | string | 是 | 100000001 | 发布任务id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| publish_id | string | 发布任务id |
| publish_status | number | 发布状态(0:成功,1:发布中,2:原创失败,3:常规失败,4:平台审核不通过,5:成功后用户删除所有文章,6:成功后系统封禁所有文章) |
| article_id | string | 成功时的图文article_id |
| article_detail | object | 文章详情 |
| fail_idx | numarray | 失败文章编号 |

##### Res.article_detail Object Payload

文章详情

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| count | number | 当发布状态为0时（即成功）时，返回文章数量 |
| item | objarray | 当发布状态为0时（即成功）时，返回文章详情 |

##### Res.article_detail.item(Array) Object Payload

当发布状态为0时（即成功）时，返回文章详情

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| idx | number | 文章对应的编号 |
| article_url | string | 图文的永久链接 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

##### 5.1 成功示例

请求示例

```json
{
  "publish_id": "100000001"
}
```

返回示例

```json
{
  "publish_id": "100000001",
  "publish_status": 0,
  "article_id": "ARTICLE_ID",
  "article_detail": {
    "count": 1,
    "item": [
      {
        "idx": 1,
        "article_url": "ARTICLE_URL"
      }
    ]
  },
  "fail_idx": []
}
```

##### 5.2 发布中示例

请求示例

```json
{
  "publish_id": "100000001"
}
```

返回示例

```json
{
  "publish_id": "100000001",
  "publish_status": 1,
  "fail_idx": [1]
}
```

##### 5.3 原创审核失败示例

请求示例

```json
{
  "publish_id": "100000001"
}
```

返回示例

```json
{
  "publish_id": "100000001",
  "publish_status": 2,
  "fail_idx": [
    1,
    2
  ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 40001 | invalid credential | 不合法的调用凭证 |
| 40002 | invalid argument | 无效参数 |
| 48001 | api unauthorized | api 功能未授权，请确认公众号/服务号已获得该接口，可以在「公众平台官网 - 开发者中心页」中查看接口权限 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 ✔

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 ✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 获取已发布图文信息

- 页面标题: 获取已发布图文信息
- 接口英文名: freepublishGetarticle
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/freepublish/getarticle?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublishgetarticle.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：freepublishGetarticle

本接口用于获取已发布的图文信息

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/freepublish/getarticle?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：7
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| article_id | string | 是 | ARTICLE_ID | 要获取的草稿的article_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| news_item | objarray | 图文信息集合 |
| errcode | number | 错误码 |
| errmsg | string | 错误描述 |

##### Res.news_item(Array) Object Payload

图文信息集合

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| title | string | 标题 |
| author | string | 作者 |
| digest | string | 图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。 |
| content | string | 图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。 图片消息则仅支持纯文本和部分特殊功能标签如商品，商品个数不可超过50个 |
| content_source_url | string | 图文消息的原文地址，即点击“阅读原文”后的URL |
| thumb_media_id | string | 图文消息的封面图片素材id（必须是永久MediaID） |
| thumb_url | string | 图文消息的封面图片URL |
| need_open_comment | number | 是否打开评论，0不打开(默认)，1打开 |
| only_fans_can_comment | number | 是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论 |
| url | string | 草稿的临时链接 |
| is_deleted | boolean | 该图文是否被删除 |

#### 4. 注意事项

本接口无特殊注意事项

#### 5. 代码示例

请求示例

```json
{
  "article_id": "ARTICLE_ID"
}
```

返回示例

```json
{
  "news_item": [
    {
      "title": "TITLE",
      "author": "AUTHOR",
      "digest": "DIGEST",
      "content": "CONTENT",
      "content_source_url": "CONTENT_SOURCE_URL",
      "thumb_media_id": "THUMB_MEDIA_ID",
      "thumb_url": "THUMB_URL",
      "show_cover_pic": 1,
      "need_open_comment": 0,
      "only_fans_can_comment": 0,
      "url": "URL",
      "is_deleted": false
    }
  ]
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |
| 48001 | api unauthorized | api 功能未授权，请确认公众号/服务号已获得该接口，可以在「公众平台官网 - 开发者中心页」中查看接口权限 |
| 53600 | Article ID 无效 | 无效的文章ID |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 ✔

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 ✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。

### 发布草稿

- 页面标题: 发布草稿
- 接口英文名: freepublish_submit
- 调用方式: POST https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=ACCESS_TOKEN
- 来源: https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_submit.html

#### 概要

调试诊断

接口应在服务器端调用，不可在前端（小程序、网页、APP等）直接调用，具体可参考 接口调用指南。

接口英文名：freepublish_submit

本接口用于将图文草稿提交发布。

开发者需要先将图文素材以草稿的形式保存，选择要发布的草稿 media_id 进行发布。

#### 1. 调用方式

##### HTTPS 调用

```bash
POST https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=ACCESS_TOKEN
```

##### 云调用

- 本接口不支持云调用。

##### 第三方调用

- 本接口支持第三方平台代商家调用。
- 该接口所属的权限集 id 为：7
- 服务商获得其中之一权限集授权后，可通过使用 authorizer_access_token 代商家进行调用，具体可查看 第三方调用 说明文档。

#### 2. 请求参数

##### 查询参数 Query String Parameters

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| access_token | string | 是 | 接口调用凭证，可使用 access_token 、 authorizer_access_token |

##### 请求体 Request Payload

| 参数名 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| media_id | string | 是 | MEDIA_ID | 要发布的草稿的media_id |

#### 3. 返回参数

##### 返回体 Response Payload

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| errcode | number | 错误码 |
| errmsg | string | 错误信息 |
| publish_id | string | 发布任务的id |
| msg_data_id | string | 消息的数据ID |

#### 4. 注意事项

请注意：正常情况下调用成功时，errcode将为0，此时只意味着发布任务提交成功，并不意味着此时发布已经完成，所以，仍有可能在后续的发布过程中出现异常情况导致发布失败，如原创声明失败、平台审核不通过等。

###### 发布结果的事件推送

由于发布任务提交后，发布任务可能在一定时间后才完成，因此，发布接口调用时，仅会给出发布任务是否提交成功的提示，若发布任务提交成功，则在发布任务结束时，会向开发者在公众平台填写的开发者URL（callback URL）推送事件。

推送的XML结构成功时示例：

```xml
<xml> 
  <ToUserName><![CDATA[gh_4d00ed8d6399]]></ToUserName>  
  <FromUserName><![CDATA[oV5CrjpxgaGXNHIQigzNlgLTnwic]]></FromUserName>  
  <CreateTime>1481013459</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[PUBLISHJOBFINISH]]></Event>
  <PublishEventInfo>
    <publish_id>2247503051</publish_id>
    <publish_status>0</publish_status>
    <article_id><![CDATA[b5O2OUs25HBxRceL7hfReg-U9QGeq9zQjiDvy
WP4Hq4]]></article_id>
    <article_detail>
      <count>1</count>
      <item>
        <idx>1</idx>
        <article_url><![CDATA[ARTICLE_URL]]></article_url>
      </item>
    </article_detail>
  </PublishEventInfo>
</xml>
```

原创审核不通过时示例：

```xml
<xml> 
  <ToUserName><![CDATA[gh_4d00ed8d6399]]></ToUserName>  
  <FromUserName><![CDATA[oV5CrjpxgaGXNHIQigzNlgLTnwic]]></FromUserName>  
  <CreateTime>1481013459</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[PUBLISHJOBFINISH]]></Event>
  <PublishEventInfo>
    <publish_id>2247503051</publish_id>
    <publish_status>2</publish_status>
    <fail_idx>1</fail_idx>
    <fail_idx>2</fail_idx>
  </PublishEventInfo>
</xml>
```

返回参数说明

| 参数 | 说明 |
| --- | --- |
| ToUserName | 公众号的ghid |
| FromUserName | 公众号群发助手的openid，为mphelper |
| CreateTime | 创建时间的时间戳 |
| MsgType | 消息类型，此处为event |
| Event | 事件信息，此处为PUBLISHJOBFINISH |
| publish_id | 发布任务id |
| publish_status | 发布状态，0:成功, 1:发布中，2:原创失败, 3: 常规失败, 4:平台审核不通过, 5:成功后用户删除所有文章, 6: 成功后系统封禁所有文章 |
| article_id | 当发布状态为0时（即成功）时，返回图文的 article_id，可用于“客服消息”场景 |
| count | 当发布状态为0时（即成功）时，返回文章数量 |
| idx | 当发布状态为0时（即成功）时，返回文章对应的编号 |
| article_url | 当发布状态为0时（即成功）时，返回图文的永久链接 |
| fail_idx | 当发布状态为2或4时，返回不通过的文章编号，第一篇为 1；其他发布状态则为空 |

#### 5. 代码示例

请求示例

```json
{
  "media_id": "MEDIA_ID"
}
```

返回示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "publish_id": "100000001"
}
```

#### 6. 错误码

以下是本接口的错误码列表，其他错误码可参考 通用错误码；调用接口遇到报错，可使用官方提供的 API 诊断工具 辅助定位和分析问题。

| 错误码 | 错误描述 | 解决方案 |
| --- | --- | --- |
| 0 | ok | 成功 |
| 48001 | api unauthorized | api 功能未授权，请确认公众号/服务号已获得该接口，可以在「公众平台官网 - 开发者中心页」中查看接口权限 |
| 53503 | 该草稿未通过发布检查 | 检查下草稿信息 |
| 53504 | 需前往公众平台官网使用草稿 | 需前往公众平台官网使用草稿 |
| 53505 | 请手动保存成功后再发表 | 请前往公众平台官网手动保存成功后再发表 |

#### 7. 适用范围

本接口在不同账号类型下的可调用情况：

公众号 服务号 仅认证 ✔

仅认证：表示仅允许企业主体已认证账号调用，未认证或不支持认证的账号无法调用。 ✔：该账号可调用此接口。 其他未明确声明的账号类型，如无特殊说明，均不可调用此接口。
