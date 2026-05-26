# UI Component Diagrams

## Component Hierarchy

```mermaid
graph TD
    App[App.jsx] --> Router[React Router]
    App --> AuthProvider[AuthProvider Context]
    App --> ThemeProvider[Theme Context]
    
    Router --> PublicRoutes[Public Routes]
    Router --> ProtectedRoutes[Protected Routes]
    
    PublicRoutes --> LoginPage[Login Page]
    PublicRoutes --> RegisterPage[Register Page]
    
    ProtectedRoutes --> Layout[Main Layout]
    Layout --> Header[Header Component]
    Layout --> Sidebar[Sidebar Component]
    Layout --> MainContent[Main Content Area]
    
    MainContent --> Dashboard[Dashboard Page]
    MainContent --> ProductionHub[Production Hub Page]
    MainContent --> Analytics[Analytics Page]
    MainContent --> Settings[Settings Page]
    
    ProductionHub --> TaskFilters[Task Filters]
    ProductionHub --> TaskStats[Task Statistics]
    ProductionHub --> TaskList[Task List Container]
    ProductionHub --> TaskForm[Task Creation Form]
    
    TaskList --> TaskCard[Task Card Component]
    TaskCard --> StatusCheckbox[Status Checkbox]
    TaskCard --> PlatformIcon[Platform Icon]
    TaskCard --> TaskActions[Task Actions Menu]
    TaskCard --> TaskDetails[Task Details Panel]
```

## State Management Flow

```mermaid
flowchart LR
    subgraph "UI Components"
        TaskCard[Task Card]
        TaskForm[Task Form]
        Dashboard[Dashboard]
    end
    
    subgraph "Zustand Store"
        TaskStore[Task Store]
        AuthStore[Auth Store]
        UIStore[UI Store]
    end
    
    subgraph "API Layer"
        TaskAPI[Task API]
        AuthAPI[Auth API]
    end
    
    subgraph "Backend"
        Server[Express Server]
        Database[(MongoDB)]
    end
    
    TaskCard --> TaskStore
    TaskForm --> TaskStore
    Dashboard --> TaskStore
    
    TaskStore --> TaskAPI
    AuthStore --> AuthAPI
    
    TaskAPI --> Server
    AuthAPI --> Server
    Server --> Database
    
    Database --> Server
    Server --> TaskAPI
    Server --> AuthAPI
    
    TaskAPI --> TaskStore
    AuthAPI --> AuthStore
    
    TaskStore --> TaskCard
    TaskStore --> TaskForm
    TaskStore --> Dashboard
```

## Form Component Structure

```mermaid
graph TD
    TaskForm[Task Form Container] --> FormProvider[Form Context Provider]
    FormProvider --> FormFields[Form Fields Section]
    FormProvider --> FormActions[Form Actions Section]
    
    FormFields --> TitleInput[Title Input Field]
    FormFields --> PlatformSelect[Platform Select]
    FormFields --> FormatSelect[Format Select]
    FormFields --> ChannelSelect[Channel Select]
    FormFields --> DatePicker[Date Picker]
    FormFields --> AssigneeSelect[Assignee Select]
    FormFields --> NotesTextarea[Notes Textarea]
    FormFields --> FileUpload[File Upload Component]
    
    FormActions --> SaveButton[Save Button]
    FormActions --> CancelButton[Cancel Button]
    FormActions --> ResetButton[Reset Button]
    
    TitleInput --> ValidationMessage[Validation Message]
    PlatformSelect --> ValidationMessage
    DatePicker --> ValidationMessage
    FileUpload --> ProgressBar[Upload Progress Bar]
    FileUpload --> FilePreview[File Preview Component]
```

## Task Card Component Breakdown

```mermaid
graph TD
    TaskCard[Task Card Container] --> CardHeader[Card Header]
    TaskCard --> CardBody[Card Body]
    TaskCard --> CardFooter[Card Footer]
    
    CardHeader --> StatusCheckbox[Status Checkbox]
    CardHeader --> TaskTitle[Task Title]
    CardHeader --> PlatformBadge[Platform Badge]
    
    CardBody --> TaskMeta[Task Metadata]
    CardBody --> TaskDescription[Task Description]
    CardBody --> TaskThumbnail[Task Thumbnail]
    
    TaskMeta --> FormatPill[Format Pill]
    TaskMeta --> ChannelInfo[Channel Info]
    TaskMeta --> ScheduleDate[Schedule Date]
    TaskMeta --> AssigneePill[Assignee Pill]
    TaskMeta --> ViewsCount[Views Count]
    
    CardFooter --> ActionButtons[Action Buttons]
    CardFooter --> TaskUrl[Task URL Link]
    
    ActionButtons --> EditButton[Edit Button]
    ActionButtons --> DeleteButton[Delete Button]
    ActionButtons --> MoreMenu[More Actions Menu]
```

## Responsive Layout Structure

```mermaid
graph TD
    ResponsiveLayout[Responsive Layout] --> DesktopView[Desktop View ≥1024px]
    ResponsiveLayout --> TabletView[Tablet View 768-1023px]
    ResponsiveLayout --> MobileView[Mobile View <768px]
    
    DesktopView --> DesktopSidebar[Fixed Sidebar]
    DesktopView --> DesktopMain[Main Content Area]
    DesktopView --> DesktopGrid[Multi-column Grid]
    
    TabletView --> TabletHeader[Collapsible Header]
    TabletView --> TabletMain[Full Width Main]
    TabletView --> TabletGrid[Two-column Grid]
    
    MobileView --> MobileHeader[Mobile Header]
    MobileView --> MobileNav[Bottom Navigation]
    MobileView --> MobileMain[Single Column]
    MobileView --> MobileStack[Stacked Layout]
    
    DesktopGrid --> TaskCards[Task Cards Grid]
    TabletGrid --> TaskCards
    MobileStack --> TaskList[Vertical Task List]
```

## Theme System Architecture

```mermaid
graph TD
    ThemeProvider[Theme Provider] --> ThemeContext[Theme Context]
    ThemeContext --> LightTheme[Light Theme Variables]
    ThemeContext --> DarkTheme[Dark Theme Variables]
    
    LightTheme --> LightColors[Light Color Palette]
    LightTheme --> LightSpacing[Light Spacing Scale]
    LightTheme --> LightTypography[Light Typography]
    
    DarkTheme --> DarkColors[Dark Color Palette]
    DarkTheme --> DarkSpacing[Dark Spacing Scale]
    DarkTheme --> DarkTypography[Dark Typography]
    
    ThemeContext --> Components[UI Components]
    Components --> Button[Button Component]
    Components --> Card[Card Component]
    Components --> Input[Input Component]
    Components --> Modal[Modal Component]
    
    Button --> ButtonVariants[Button Variants]
    ButtonVariants --> PrimaryButton[Primary Button]
    ButtonVariants --> SecondaryButton[Secondary Button]
    ButtonVariants --> DangerButton[Danger Button]
```

## Data Flow in Task Management

```mermaid
sequenceDiagram
    participant U as User
    participant TC as Task Card
    participant TS as Task Store
    participant API as Task API
    participant DB as Database
    
    U->>TC: Click Status Checkbox
    TC->>TS: updateTaskStatus(id, newStatus)
    TS->>TS: Optimistic Update
    TS->>TC: Re-render with new status
    TS->>API: PATCH /tasks/:id
    API->>DB: Update task document
    DB-->>API: Updated task
    API-->>TS: Success response
    TS->>TS: Confirm update
    
    Note over TS,API: If API fails, revert optimistic update
    
    alt API Error
        API-->>TS: Error response
        TS->>TS: Revert to previous state
        TS->>TC: Re-render with old status
        TS->>U: Show error message
    end
```