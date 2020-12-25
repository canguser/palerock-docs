# 在前后端分离的项目中，后台使用 shiro 框架时，怎样使用它的会话管理系统 (session)，从而实现权限控制

在前后端分离的项目中，ajax跨域和保存用户信息是其中的重点和难点。如果在后台使用 `shiro` 框架来进行权限控制，就需要用到 `cookie + session` 的模式来保存用户的信息。

在前一篇文章[《在前后端分离的项目中，ajax跨域请求怎样附带cookie》](https://palerock.cn/articles/001lND0KEAd)中，我具体写了怎样在 ajax 跨域的情况下携带 `cookie`，使用该方法使跨域请求携带 `cookie` 便可以在前后端分离的项目中使用 `shrio` 的 `session`（会话管理系统）。但是由于那种方法近乎与取巧的将 `Access-Control-Allow-Origin` 由 `*` 改为 `"null"` 不是所有的前端ajax框架所公认的，我们需要一种更好的模式来使用 session。

在传统的前后端分离模式中，我们通常是在请求头中增加一个请求头`Authorization`，它的值是一串加密的信息或者密钥，在后台通过对这个请求头值的读取，获取用户的信息。而在这样的模式中，通常都是开发者自己设计的 `session` 或者加密方式来读取和保存用户信息，而在 shiro 中，集成了权限控制和用户管理在它的 `session` 系统中，这就意味着我们只能通过他所规定的 `session + cookie` 来保存用户信息，在这种情况下，该以什么方式在前后端分离的项目中使用 `shiro` ？

通过资料的查询，和对 `shiro` 设计模式的解读，我发现 `shiro` 和 `servlet` 一样实在 `cookie` 中存储一个 `session` 会话的 `id` 然后在每次请求中读取该 `session` 的 `id` 并获取 `session`，这样就可以获取指定 `session` 中储存的用户信息。

我的想法就是**通过重写 shiro 中获取 cookie 中的 sessionId 的方法来获取请求头Authorization中的密钥，而密钥储存的便是登录是返回的 sessionId，从而实现在前后端分离的项目中使用shiro框架**。

接下来就是代码演示（使用`SpringMVC+Shiro`），只贴出核心代码。

首先是登录的代码：

```java
@ResponseBody
@RequestMapping(value = "/login", method = RequestMethod.POST, produces = "application/json;charset=utf-8")
public String login(
    @RequestParam(required = false) String username,
    @RequestParam(required = false) String password
    ) {
    JSONObject jsonObject = new JSONObject();

    Subject subject = SecurityUtils.getSubject();

    password = MD5Tools.MD5(password);

    UsernamePasswordToken token = new UsernamePasswordToken(username, password);

    try {
        // 登录，即身份验证
        subject.login(token);
        User user = userService.getUserByLoginName(token.getUsername());
        // 在session中存放用户信息
        subject.getSession().setAttribute(“userLogin”, user);
        jsonObject.put(“error”, 0);
        jsonObject.put(“msg”, “登录成功”);
        // 返回sessionId作为token
        jsonObject.put(“token”,subject.getSession().getId());
    } catch (IncorrectCredentialsException e) {
        throw new JsonException(“用户名或密码错误”, 405);
    } catch (LockedAccountException e) {
        throw new JsonException(“登录失败，该用户已被冻结”, 405);
    } catch (AuthenticationException e) {
        throw new JsonException(“用户名或密码错误”, 405);
    }
    return jsonObject.toString();
}
```
然后重写 `DefaultWebSessionManager` 的 `getSessionId` 方法
```java
package com.cangshi.shiro.ssesion;

import org.apache.shiro.web.servlet.ShiroHttpServletRequest;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;
import org.apache.shiro.web.util.WebUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.Serializable;


/**
Created by Palerock
*/
public class SessionManager extends DefaultWebSessionManager {
    private static final Logger log = LoggerFactory.getLogger(DefaultWebSessionManager.class);
    private String authorization = “Authorization”;
    /**
    重写获取sessionId的方法调用当前Manager的获取方法
    @param request
    @param response
    @return
    */
    @Override
    protected Serializable getSessionId(ServletRequest request, ServletResponse response) {
        String id = WebUtils.toHttp(request).getHeader(this.authorization);
        if (id == null){
            return super.getSessionId(request, response)
        }
        return id;
    }
}
```  
在重写这个方法的时候，让在不使用 ajax 的情况下能够正常使用 `cookie + session` 模式，而我们在步骤中加入从请求头中获取 sessionId 的部分也就是：
```java
// 获取请求头中的session
String id = WebUtils.toHttp(request).getHeader(this.authorization);
```  
当该 id 存在就不从 cookie 中获取 id，自然达到了通过 `Authorization` 请求头获取 sessionId 并获取 session 的目的。

接下来就是Spring中xml中的配置会话管理器
```xml
<bean id=“sessionManager” class=“com.cangshi.shiro.ssesion.SessionManager”>
<!–其它相关设置–>
</bean>
```
这样我们在跨域的 ajax 请求中登录获取token，然后在接下来的请求的请求头中加上 `Authorization:[token]` 就可以使用 `shrio` 所自带的会话管理器，从而使用 `shiro` 的权限控制。