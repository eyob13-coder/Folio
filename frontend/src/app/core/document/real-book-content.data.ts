export interface BookChapter {
  id: string;
  title: string;
  pageNumber: number;
  content: string;
}

export interface BookFullContent {
  bookId: string;
  chapters: BookChapter[];
}

export const REAL_BOOK_CONTENTS: Record<string, BookFullContent> = {
  'book-ddia': {
    bookId: 'book-ddia',
    chapters: [
      {
        id: 'ddia-ch1',
        title: 'Chapter 1: Reliable, Scalable, and Maintainable Systems',
        pageNumber: 1,
        content: `Many applications today are data-intensive, as opposed to compute-intensive. Raw CPU power is rarely a limiting factor for these systems—bigger problems are usually the amount of data, the complexity of data, and the speed at which it is changing.

A data-intensive application is typically built from standard building blocks that provide commonly needed functionality:
1. Store data so that they, or another application, can find it again later (databases).
2. Remember the result of an expensive operation, to speed up reads (caches).
3. Allow users to search data by keyword or filter it in various ways (search indexes).
4. Send a message to another process, to be handled asynchronously (stream processing).
5. Periodically crunch a large chunk of accumulated data (batch processing).

Reliability means making systems work correctly, even when things go wrong. Faults are deviations of one component from its spec, whereas failure is when the system as a whole stops providing the required service to the user. We design fault-tolerant systems using active replication, redundancy, and automated health checks.`
      },
      {
        id: 'ddia-ch5',
        title: 'Chapter 5: High-Availability Replication',
        pageNumber: 151,
        content: `Replication means keeping a copy of the same data on multiple machines that are connected via a network. There are three primary reasons why you might want to replicate data:
- High availability: keeping the system functioning even if one machine goes down.
- Disconnected operation: allowing an application to continue working when there is a network interruption.
- Latency: placing data geographically close to your users so that they can interact with it faster.
- Scalability: being able to handle a higher volume of reads than a single machine could handle.

In leader-based replication (also known as active/passive or master/slave):
1. One of the replicas is designated the leader (master). When clients want to write to the database, they must send their requests to the leader.
2. The other replicas are followers (read replicas). Whenever the leader writes new data to its local storage, it sends the data change to all its followers as part of a replication log or change stream.
3. When a client wants to read from the database, it can query either the leader or any of the followers.`
      },
      {
        id: 'ddia-ch9',
        title: 'Chapter 9: Consistency and Consensus',
        pageNumber: 334,
        content: `Consensus is one of the most important and fundamental problems in distributed computing. On the surface, it seems simple: decide on something, and have all nodes agree.

In formal terms: one or more nodes may propose values, and the consensus algorithm decides on one of those values. The algorithm must satisfy:
- Uniform agreement: No two nodes decide differently.
- Integrity: No node decides twice.
- Validity: If a node decides value v, then v must have been proposed by some node.
- Termination: Every node that does not crash eventually decides some value.

The CAP theorem (often framed as Consistency, Availability, Partition tolerance) shows that when a network partition occurs, you must choose between Consistency (linearizability) or Availability. If your network links between data centers are severed, an available node might return stale data, violating linearizability. Practical systems model this with the PACELC formulation: If Partition (P), choose Availability (A) or Consistency (C); Else (E), trade off Latency (L) against Consistency (C).`
      }
    ]
  },
  'book-clean-arch': {
    bookId: 'book-clean-arch',
    chapters: [
      {
        id: 'clean-ch1',
        title: 'Chapter 1: What Is Architecture?',
        pageNumber: 1,
        content: `The architecture of a software system is the shape given to that system by those who build it. The purpose of that shape is to facilitate the development, deployment, operation, and maintenance of the software system contained within it.

The primary way that shape accomplishes this is to leave as many options open as possible, for as long as possible. The primary cost of software is not writing code; it is reading, refactoring, and maintaining existing code over years of changing business requirements.

A good software architecture makes the system easy to understand, easy to develop, easy to maintain, and easy to deploy. The ultimate goal is to minimize the lifetime human resource cost required to build and maintain the required system.`
      },
      {
        id: 'clean-ch5',
        title: 'Chapter 5: SOLID Principles of Component Design',
        pageNumber: 65,
        content: `The SOLID principles tell us how to arrange our functions and data structures into classes, and how those classes should be interconnected:
- SRP: Single Responsibility Principle. A module should be responsible to one, and only one, actor.
- OCP: Open-Closed Principle. A software artifact should be open for extension but closed for modification.
- LSP: Liskov Substitution Principle. Subtypes must be substitutable for their base types without altering system correctness.
- ISP: Interface Segregation Principle. Make fine-grained interfaces that are client-specific; avoid forcing implementers to depend on methods they do not use.
- DIP: Dependency Inversion Principle. The most flexible systems are those in which source code dependencies refer only to abstractions, not to concretions. High-level policies should not depend on low-level details; both should depend on abstractions.`
      },
      {
        id: 'clean-ch22',
        title: 'Chapter 22: The Clean Architecture',
        pageNumber: 200,
        content: `Over the last several decades we have seen a whole range of ideas regarding system architecture: Hexagonal Architecture (Ports and Adapters), Onion Architecture, and Screaming Architecture. Though they all vary somewhat in their details, they are very similar:
1. Independent of Frameworks. The architecture does not depend on the existence of some library of feature-laden software.
2. Testable. The business rules can be tested without the UI, Database, Web Server, or any other external element.
3. Independent of UI. The UI can change easily without changing the rest of the system.
4. Independent of Database. You can swap Oracle or SQL Server for Mongo, CouchDB, or memory without rewriting business rules.
5. Independent of any external agency. Your business rules simply don't know anything at all about the outside world.

The overarching rule is The Dependency Rule: source code dependencies must point only inward, toward higher-level policies.`
      }
    ]
  },
  'book-sys-design': {
    bookId: 'book-sys-design',
    chapters: [
      {
        id: 'sys-ch1',
        title: 'Chapter 1: Scale From Zero to Millions of Users',
        pageNumber: 1,
        content: `Building a system that supports millions of users is a journey of incremental optimization. We begin with a single server setup where the web app, database, and cache run on the same box.

Step 1: Separate the database tier from the web server tier. This allows independent vertical scaling and CPU allocation.
Step 2: Add a Load Balancer (such as NGINX or HAProxy). Web servers are placed behind public IPs, routing traffic to private IPs.
Step 3: Database replication. Set up primary-replica replication: writes go to primary; reads are distributed across read-replicas.
Step 4: Cache tier (Redis or Memcached). Invalidate cache on write; serve sub-millisecond reads directly from memory.
Step 5: Content Delivery Network (CDN). Cache static assets (images, videos, JS, CSS) at edge nodes geographically close to users.
Step 6: Stateless web tier. Move session data out of the web tier into shared persistent storage (Redis). Now web servers can scale horizontally with auto-scaling groups.`
      },
      {
        id: 'sys-ch4',
        title: 'Chapter 4: Design a Distributed Rate Limiter',
        pageNumber: 85,
        content: `A rate limiter controls the rate of traffic sent by a client or service. In the HTTP world, it limits the number of client requests allowed within a specified timeframe. If request count exceeds the threshold, excess calls are blocked (HTTP 429 Too Many Requests).

Core Algorithms:
1. Token Bucket: Tokens are added to a bucket at a constant rate. Each request consumes one token. If no tokens exist, request is dropped. Simple, memory-efficient, handles bursts.
2. Leaky Bucket: Requests enter a FIFO queue. Requests are processed at a fixed rate. Smooths out traffic spikes.
3. Fixed Window Counter: Divides timeline into fixed windows and increments counter. Suffers from boundary burst issues (2x traffic at window edges).
4. Sliding Window Counter: Combines fixed window with previous window weight percentage. High accuracy with minimal memory footprint.`
      }
    ]
  },
  'book-sys-perf': {
    bookId: 'book-sys-perf',
    chapters: [
      {
        id: 'perf-ch1',
        title: 'Chapter 1: Systems Observability & The USE Method',
        pageNumber: 1,
        content: `Systems performance analyzes the entire software and hardware stack: applications, libraries, runtimes, system calls, kernels, device drivers, and hardware.

The USE Method (Utilization, Saturation, Errors):
For every resource (CPU, memory, storage devices, network interfaces, buses):
1. Utilization: The percentage of time that the resource was busy servicing work.
2. Saturation: The degree to which extra work is queued waiting for the resource.
3. Errors: The count of error events.

If a resource is at 100% utilization, check saturation (queue length). High saturation explains elevated latency before total failure occurs.`
      },
      {
        id: 'perf-ch6',
        title: 'Chapter 6: Modern eBPF Tracing & Flame Graphs',
        pageNumber: 210,
        content: `Extended Berkeley Packet Filter (eBPF) has revolutionized Linux systems performance. It allows running sandboxed programs in the Linux kernel without changing kernel source code or loading kernel modules.

Flame Graphs are a visualization of profiled software, where the x-axis represents the population (frequency of CPU samples) and the y-axis shows stack trace depth.
Each box represents a function in the stack trace. The wider a box, the more CPU time was consumed by that function or its children. Reading a flame graph allows identifying performance bottlenecks and lock contention within seconds.`
      }
    ]
  }
};
