# Tổng hợp Kiến thức Cơ bản: React, Zustand, NestJS, Prisma

Tài liệu này tóm tắt các khái niệm cốt lõi của bốn công nghệ quan trọng, được biên soạn dựa trên ngữ cảnh dự án hiện tại của bạn (React + Express + Prisma).

## 1. React (Frontend)
React là thư viện JavaScript để xây dựng giao diện người dùng, hiện được sử dụng trong thư mục `src/` của dự án.

### Các khái niệm cốt lõi
1.  **Components (Thành phần)**
    *   Xây dựng giao diện từ các mảnh nhỏ, tái sử dụng được (Functional Components).
    *   Ví dụ: `MessageBubble.tsx` trong dự án của bạn là một component hiển thị tin nhắn.
    *   **JSX/TSX**: Cú pháp mở rộng cho phép viết HTML trong JS/TS.

2.  **Hooks (Móc nối)**
    *   `useState`: Quản lý trạng thái cục bộ của component.
        ```tsx
        const [count, setCount] = useState(0);
        ```
    *   `useEffect`: Xử lý side-effects (gọi API, subscriptions) sau khi render.
        ```tsx
        useEffect(() => {
          // Chạy khi component mount
          fetchData();
        }, []); // Dependency array rỗng = chỉ chạy 1 lần
        ```
    *   `useContext`: Chia sẻ dữ liệu (theme, auth) qua cây component mà không cần truyền props thủ công.

3.  **Props & State**
    *   **Props**: Dữ liệu truyền từ cha xuống con (read-only).
    *   **State**: Dữ liệu nội tại của component, có thể thay đổi và kích hoạt render lại.

---

## 2. Zustand (State Management)
*Lưu ý: Dự án hiện tại chưa thấy sử dụng Zustand, nhưng đây là giải pháp quản lý state rất phổ biến, nhẹ hơn Redux.*

### Tại sao dùng Zustand?
*   Đơn giản, không cần boilerplate (rườm rà) như Redux.
*   Dùng hooks để lấy state trực tiếp.

### Cách sử dụng cơ bản
1.  **Tạo Store (`store.ts`)**
    ```ts
    import { create } from 'zustand'

    interface AppState {
      bears: number
      increase: (by: number) => void
    }

    const useStore = create<AppState>((set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }))
    ```

2.  **Sử dụng trong Component**
    ```tsx
    function BearCounter() {
      const bears = useStore((state) => state.bears)
      return <h1>{bears} around here...</h1>
    }
    ```

### Ứng dụng cho dự án này
Bạn có thể dùng Zustand để lưu trữ `currentUser` hoặc `activeConversationId` thay vì truyền props quá nhiều cấp.

---
    
## 3. NestJS (Backend Framework)
*Lưu ý: Backend hiện tại của bạn đang dùng **Express** thuần (`server/index.ts`). NestJS là một framework xây dựng trên Node.js (thường dùng Express bên dưới) nhưng có cấu trúc chặt chẽ hơn.*

### Kiến trúc chính (Modular)
NestJS tổ chức code thành 3 phần chính (khác với routes/controllers tự do của Express):

1.  **Modules (`@Module`)**: Gom nhóm các tính năng liên quan (VD: `UsersModule`, `AuthModule`).
2.  **Controllers (`@Controller`)**: Xử lý request, trả về response (tương tự file routes của bạn).
    ```ts
    @Controller('users')
    export class UsersController {
      @Get()
      findAll() { return 'Get all users'; }
    }
    ```
3.  **Services (Providers - `@Injectable`)**: Chứa logic nghiệp vụ, xử lý dữ liệu.
    ```ts
    @Injectable()
    export class UsersService {
      // Logic tìm user trong DB ở đây
    }
    ```

### So sánh với Express hiện tại
*   **Express**: Tự do, linh hoạt, bạn tự quyết định cấu trúc thư mục (`routes/`, `controllers/`).
*   **NestJS**: Opinionated (có quy tắc), hỗ trợ Dependency Injection mạnh mẽ, phù hợp dự án lớn (Enterprise).

---

## 4. Prisma (ORM)
Prisma là công cụ làm việc với Database đang được sử dụng trong dự án (`server/prisma/schema.prisma`).

### Các thành phần chính
1.  **Prisma Schema (`schema.prisma`)**
    *   Nơi định nghĩa cấu trúc dữ liệu.
    *   Hiện tại bạn có các model như `User`, `Message`, `AuditLog`.
    *   Quan hệ: `messages Message[]` trong `User` thể hiện quan hệ 1-n.

2.  **Prisma Client**
    *   Thư viện tự động sinh ra (Type-safe) để query DB.
    *   Ví dụ query trong dự án của bạn (dựa trên schema):

    **Tạo tin nhắn mới:**
    ```ts
    const newMessage = await prisma.message.create({
      data: {
        content: "Hello Prisma",
        sender_id: 1,
        conversation_id: 2
      }
    })
    ```

    **Lấy danh sách User kèm tin nhắn:**
    ```ts
    const users = await prisma.user.findMany({
      include: {
        messages: true // Join bảng messages
      }
    })
    ```

3.  **Migrations**
    *   Lệnh `npx prisma migrate dev`: Đồng bộ thay đổi trong `schema.prisma` vào Database thật và tạo lịch sử migrate.

### Mẹo cho dự án
*   Schema của bạn dùng `@map` (ví dụ `@@map("users")`): Điều này tốt để giữ tên bảng trong DB chuẩn snake_case trong khi dùng camelCase trong code JS/TS.
