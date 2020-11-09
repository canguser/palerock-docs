# 关于Apex 中 Set 去重的 Issue - Winter’21

## 描述

使用 Apex 中的 Set 时，添加一个相同地址的对象时，无论添加多少次理应只有一个对象存在。但在实际操作中，如果在每次添加前改动对象的一些属性，这次添加后的 Set 在未访问的情况下，同时存在该对象的多个元素，和 List 一样。但如果你访问了该 Set (调用 `toString` 方法)，其包含的元素才会被去重。

e.g.
```java
Set<Account> accounts = new Set<Account>();
Account account = new Account(Name = 'Test Account');

accounts.add(account);

// First changed
account.Phone = '100001';
accounts.add(account);

// The second time changed
account.Phone = '100002';
accounts.add(account);

// System.debug(accounts); // If there is no comment, the next line output of the set is: 3
// In the case of doing comment the previous line out, the output is: 1
System.debug(accounts.size());
Integer hashCode2 = accounts.hashCode();

// In this case, the annotated case is a list containing three elements, and the uncommented case is a list containing one element
System.debug(new List<Account>(accounts)); 
```

## 解决方法
1. 通过 `new Set()` 将该 `Set` 作为参数传入构造方法中
    ```java
    Set<Account> finalSet = new Set<Account>(accounts);
    ```
2. 通过新建 Set 对象的 `addAll` 方法重建一个新的 Set
    ```java
    Set<Account> finalSet = new Set<Account>();
    finalSet.addAll(accounts);
    ```

## 可能导致的原因
由于 `Apex` 底层是基于 `Java` 可能在 List 或 Set 的实现上是通过 `Iterator` 实现的，所以其内部可能都是允许放置多个重复的对象的，只是 Set 在读取的时候，会对内部对象列表进行去重，所以导致如果 Set 对象没有被读取，其内部依然会存在多个相同的对象，但很奇怪的是，如果内部存放的是 Integer 或其它基础类型，便没有该问题。